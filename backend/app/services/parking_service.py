"""
app/services/parking_service.py
Logique métier : entrée/sortie véhicule, calcul du prix, gestion des places.
"""
from datetime import datetime
from app.database import Database


class ParkingService:
    """Service métier pour la gestion du parking."""

    # ── Tarifs fallback si pricing_plans vide ────────────────────
    DEFAULT_RATES = {
        'Voiture': 5.0,
        'Moto':    2.5,
        'Camion': 10.0,
    }
    DEFAULT_DAILY_MAX = {
        'Voiture': 50.0,
        'Moto':    25.0,
        'Camion': 100.0,
    }

    # ── Calcul de prix ───────────────────────────────────────────

    @staticmethod
    def calculate_price(vehicle_type: str,
                        entry_time: datetime,
                        exit_time:  datetime) -> tuple[float, int]:
        """
        Calcule le prix et la durée en minutes.
        Retourne (price, duration_minutes).
        """
        duration_minutes = max(1, int((exit_time - entry_time).total_seconds() / 60))

        plan = Database.execute_query_one(
            """SELECT price_per_hour, daily_max
               FROM pricing_plans
               WHERE vehicle_type = %s AND is_active = TRUE
               LIMIT 1""",
            (vehicle_type,)
        )

        if plan:
            rate      = float(plan['price_per_hour'])
            daily_max = float(plan['daily_max']) if plan['daily_max'] else None
        else:
            rate      = ParkingService.DEFAULT_RATES.get(vehicle_type, 5.0)
            daily_max = ParkingService.DEFAULT_DAILY_MAX.get(vehicle_type)

        price = rate * (duration_minutes / 60)

        if daily_max:
            price = min(price, daily_max)

        return round(price, 2), duration_minutes

    # ── Gestion des places ───────────────────────────────────────

    @staticmethod
    def find_available_spot(vehicle_type: str) -> str | None:
        """Retourne le spot_number d'une place libre, ou None si plein."""
        row = Database.execute_query_one(
            """SELECT spot_number FROM parking_spaces
               WHERE space_type = %s AND is_available = TRUE AND is_reserved = FALSE
               ORDER BY spot_number ASC
               LIMIT 1""",
            (vehicle_type,)
        )
        return row['spot_number'] if row else None

    @staticmethod
    def occupy_spot(spot_number: str):
        """Marque une place comme occupée."""
        Database.execute_query(
            "UPDATE parking_spaces SET is_available = FALSE WHERE spot_number = %s",
            (spot_number,)
        )

    @staticmethod
    def free_spot(spot_number: str):
        """Libère une place."""
        if spot_number:
            Database.execute_query(
                "UPDATE parking_spaces SET is_available = TRUE WHERE spot_number = %s",
                (spot_number,)
            )

    # ── Capacité ─────────────────────────────────────────────────

    @staticmethod
    def get_capacity_summary() -> dict:
        """Retourne la capacité totale et disponible par type."""
        rows = Database.execute_query(
            """SELECT space_type,
                      COUNT(*) AS total,
                      SUM(is_available) AS available
               FROM parking_spaces
               GROUP BY space_type""",
            fetch=True
        )
        return {r['space_type']: {
            'total':     r['total'],
            'available': r['available'],
            'occupied':  r['total'] - r['available']
        } for r in rows} if rows else {}

    # ── Enregistrement entrée ────────────────────────────────────

    @staticmethod
    def register_entry(license_plate: str,
                       vehicle_type:  str,
                       agent_id:      int | None = None,
                       spot_number:   str | None = None) -> dict:
        """
        Enregistre une entrée :
        - Trouve ou utilise le spot fourni
        - Insère dans parking_entries
        - Marque la place occupée
        Retourne {'entry_id', 'spot_number', 'entry_time'} ou lève ValueError.
        """
        # Vérifier qu'il n'y a pas déjà un IN pour cette plaque
        existing = Database.execute_query_one(
            "SELECT id FROM parking_entries WHERE license_plate = %s AND status = 'IN'",
            (license_plate,)
        )
        if existing:
            raise ValueError(f'Le véhicule {license_plate} est déjà dans le parking.')

        # Trouver une place si non fournie
        if not spot_number:
            spot_number = ParkingService.find_available_spot(vehicle_type)
            if not spot_number:
                raise ValueError(f'Aucune place disponible pour type {vehicle_type}.')

        # Résoudre vehicle_id
        vehicle = Database.execute_query_one(
            "SELECT id FROM vehicles WHERE license_plate = %s AND is_active = TRUE",
            (license_plate,)
        )
        vehicle_id = vehicle['id'] if vehicle else None

        # Insérer l'entrée
        entry_id = Database.execute_query(
            """INSERT INTO parking_entries
               (license_plate, vehicle_id, agent_id, spot_number, vehicle_type, status)
               VALUES (%s, %s, %s, %s, %s, 'IN')""",
            (license_plate, vehicle_id, agent_id, spot_number, vehicle_type)
        )

        # Occuper la place
        ParkingService.occupy_spot(spot_number)

        return {
            'entry_id':    entry_id,
            'spot_number': spot_number,
            'entry_time':  datetime.now().isoformat()
        }

    # ── Enregistrement sortie ────────────────────────────────────

    @staticmethod
    def register_exit(license_plate:  str,
                      payment_method: str = 'CASH') -> dict:
        """
        Enregistre une sortie :
        - Calcule la durée et le prix
        - Met à jour parking_entries
        - Libère la place
        - Crée un paiement
        Retourne {'entry_id', 'price', 'duration_minutes', 'payment_id'}.
        """
        entry = Database.execute_query_one(
            """SELECT * FROM parking_entries
               WHERE license_plate = %s AND status = 'IN'
               ORDER BY entry_time DESC LIMIT 1""",
            (license_plate,)
        )
        if not entry:
            raise ValueError(f'Aucune entrée active trouvée pour {license_plate}.')

        exit_time    = datetime.now()
        entry_time   = entry['entry_time']
        vehicle_type = entry.get('vehicle_type', 'Voiture')

        price, duration = ParkingService.calculate_price(vehicle_type, entry_time, exit_time)

        # Mettre à jour l'entrée
        Database.execute_query(
            """UPDATE parking_entries
               SET exit_time = %s, status = 'OUT', price = %s, duration_minutes = %s
               WHERE id = %s""",
            (exit_time, price, duration, entry['id'])
        )

        # Libérer la place
        ParkingService.free_spot(entry.get('spot_number'))

        # Créer le paiement
        payment_id = Database.execute_query(
            """INSERT INTO payments (parking_entry_id, amount, payment_method, payment_status, paid_at)
               VALUES (%s, %s, %s, 'PAID', NOW())""",
            (entry['id'], price, payment_method)
        )

        return {
            'entry_id':         entry['id'],
            'price':            price,
            'duration_minutes': duration,
            'payment_id':       payment_id,
            'exit_time':        exit_time.isoformat()
        }
