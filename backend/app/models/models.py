"""
app/models/models.py
Modèles de données — accès BD uniquement, sans logique métier.
"""
from app.database import Database


class User:

    @staticmethod
    def create(name, email, password, role='CLIENT', phone=None):
        # `phone` non persisté tant que la colonne n'existe pas (voir migrations/002).
        from app.utils.auth import AuthHelper
      hashed = AuthHelper.hash_password(password)
    # Insère l'user et retourne son ID
      user_id = Database.execute_query(
        "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
        (name, email, hashed, role)
     )
      return user_id  # ✅ Nécessaire pour créer le véhicule ensuite dans auth.py

    @staticmethod
    def get_by_email(email):
        return Database.execute_query_one("SELECT * FROM users WHERE email = %s", (email,))

    @staticmethod
    def get_by_id(user_id):
        return Database.execute_query_one(
            "SELECT * FROM users WHERE id = %s AND is_active = TRUE", (user_id,)
        )

    @staticmethod
    def get_all(page=1, per_page=20):
        offset = (page - 1) * per_page
        return Database.execute_query(
            "SELECT id,name,email,role,is_active,last_login,created_at "
            "FROM users WHERE is_active = TRUE ORDER BY created_at DESC LIMIT %s OFFSET %s",
            (per_page, offset), fetch=True
        )

    @staticmethod
    def update(user_id, **kwargs):
        allowed = ['name', 'email', 'role']
        updates, params = [], []
        for k, v in kwargs.items():
            if k in allowed:
                updates.append(f"{k} = %s")
                params.append(v)
        if not updates:
            return False
        params.append(user_id)
        Database.execute_query(
            f"UPDATE users SET {', '.join(updates)} WHERE id = %s", params
        )
        return True

    @staticmethod
    def soft_delete(user_id):
        """Désactive un utilisateur sans le supprimer physiquement."""
        Database.execute_query(
            "UPDATE users SET is_active = FALSE, deleted_at = NOW() WHERE id = %s",
            (user_id,)
        )
        return True

    @staticmethod
    def delete(user_id):
        return User.soft_delete(user_id)


class Vehicle:

    @staticmethod
    def create(license_plate, vehicle_type='Voiture', user_id=None, brand=None, color=None):
        # brand/color : ajouter colonnes + migrations/002 pour les persister
        return Database.execute_query(
            "INSERT INTO vehicles (license_plate, vehicle_type, user_id) VALUES (%s,%s,%s)",
            (license_plate.upper(), vehicle_type, user_id)
        )

    @staticmethod
    def get_all():
        return Database.execute_query(
            "SELECT * FROM vehicles WHERE is_active = TRUE ORDER BY created_at DESC",
            fetch=True
        )

    @staticmethod
    def get_by_id(vehicle_id):
        return Database.execute_query_one(
            "SELECT * FROM vehicles WHERE id = %s AND is_active = TRUE", (vehicle_id,)
        )

    @staticmethod
    def get_by_plate(plate):
        return Database.execute_query_one(
            "SELECT * FROM vehicles WHERE license_plate = %s AND is_active = TRUE",
            (plate.upper(),)
        )

    @staticmethod
    def entry(license_plate, spot_number, vehicle_type='Voiture'):
        return Database.execute_query(
            "INSERT INTO parking_entries (license_plate, spot_number, vehicle_type, status) "
            "VALUES (%s,%s,%s,'IN')",
            (license_plate, spot_number, vehicle_type)
        )

    @staticmethod
    def exit(license_plate, price=None):
        return Database.execute_query(
            """UPDATE parking_entries SET exit_time = NOW(), status = 'OUT', price = %s
               WHERE license_plate = %s AND status = 'IN'
               ORDER BY entry_time DESC LIMIT 1""",
            (price, license_plate)
        )

    @staticmethod
    def get_active_vehicles():
        return Database.execute_query(
            "SELECT * FROM parking_entries WHERE status = 'IN' ORDER BY entry_time DESC",
            fetch=True
        )

    @staticmethod
    def get_vehicle_history(license_plate):
        return Database.execute_query(
            "SELECT * FROM parking_entries WHERE license_plate = %s ORDER BY entry_time DESC",
            (license_plate,), fetch=True
        )


class Subscription:

    @staticmethod
    def create(user_id, vehicle_id, license_plate, plan_type, start_date, end_date,
               price_paid=None, notes=None):
        return Database.execute_query(
            """INSERT INTO subscriptions
               (user_id, vehicle_id, license_plate, plan_type, start_date, end_date,
                price_paid, status, notes)
               VALUES (%s,%s,%s,%s,%s,%s,%s,'ACTIVE',%s)""",
            (user_id, vehicle_id, license_plate, plan_type, start_date, end_date, price_paid, notes)
        )

    @staticmethod
    def get_all():
        return Database.execute_query(
            "SELECT * FROM subscriptions ORDER BY created_at DESC", fetch=True
        )

    @staticmethod
    def get_by_id(sub_id):
        return Database.execute_query_one("SELECT * FROM subscriptions WHERE id = %s", (sub_id,))

    @staticmethod
    def get_by_user(user_id):
        return Database.execute_query(
            "SELECT * FROM subscriptions WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,), fetch=True
        )

    @staticmethod
    def update_status(sub_id, status):
        Database.execute_query("UPDATE subscriptions SET status = %s WHERE id = %s", (status, sub_id))
        return True


class Reclamation:

    @staticmethod
    def create(user_id, subject, description, status='OPEN'):
        return Database.execute_query(
            "INSERT INTO reclamations (user_id, subject, description, status) VALUES (%s,%s,%s,%s)",
            (user_id, subject, description, status)
        )

    @staticmethod
    def get_all():
        return Database.execute_query(
            """SELECT r.*, u.name AS user_name
               FROM reclamations r JOIN users u ON r.user_id = u.id
               ORDER BY r.created_at DESC""",
            fetch=True
        )

    @staticmethod
    def get_by_id(rec_id):
        return Database.execute_query_one("SELECT * FROM reclamations WHERE id = %s", (rec_id,))

    @staticmethod
    def get_by_user(user_id):
        return Database.execute_query(
            "SELECT * FROM reclamations WHERE user_id = %s ORDER BY created_at DESC",
            (user_id,), fetch=True
        )

    @staticmethod
    def update_status(rec_id, status, resolved_by=None):
        if status in ('RESOLVED', 'CLOSED') and resolved_by:
            Database.execute_query(
                "UPDATE reclamations SET status=%s, resolved_by=%s, resolved_at=NOW() WHERE id=%s",
                (status, resolved_by, rec_id)
            )
        else:
            Database.execute_query(
                "UPDATE reclamations SET status=%s WHERE id=%s", (status, rec_id)
            )
        return True


class ParkingStats:

    @staticmethod
    def get_today():
        entries = Database.execute_query_one(
            "SELECT COUNT(*) AS cnt FROM parking_entries WHERE DATE(entry_time) = CURDATE()"
        )
        exits = Database.execute_query_one(
            "SELECT COUNT(*) AS cnt, COALESCE(SUM(price),0) AS revenue "
            "FROM parking_entries WHERE DATE(exit_time) = CURDATE() AND status='OUT'"
        )
        active = Database.execute_query_one(
            "SELECT COUNT(*) AS cnt FROM parking_entries WHERE status='IN'"
        )
        return {
            'entries_today': entries['cnt'] if entries else 0,
            'exits_today':   exits['cnt']   if exits   else 0,
            'revenue_today': float(exits['revenue']) if exits else 0.0,
            'active_now':    active['cnt']  if active  else 0,
        }

    @staticmethod
    def get_overview():
        users    = Database.execute_query_one("SELECT COUNT(*) AS cnt FROM users WHERE is_active=TRUE")
        vehicles = Database.execute_query_one("SELECT COUNT(*) AS cnt FROM vehicles WHERE is_active=TRUE")
        subs     = Database.execute_query_one("SELECT COUNT(*) AS cnt FROM subscriptions WHERE status='ACTIVE'")
        recs     = Database.execute_query_one("SELECT COUNT(*) AS cnt FROM reclamations WHERE status IN ('OPEN','IN_PROGRESS')")
        revenue  = Database.execute_query_one("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE payment_status='PAID'")
        return {
            'total_users':            users['cnt']          if users    else 0,
            'total_vehicles':         vehicles['cnt']       if vehicles else 0,
            'active_subscriptions':   subs['cnt']           if subs     else 0,
            'open_reclamations':      recs['cnt']           if recs     else 0,
            'total_revenue':          float(revenue['total']) if revenue else 0.0,
        }
