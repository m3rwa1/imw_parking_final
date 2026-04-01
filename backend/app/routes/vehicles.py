"""
backend/app/routes/vehicles.py — Version finale
Places occupées calculées depuis parking_entries en temps réel
"""
from flask import Blueprint, request, jsonify
from app.utils    import token_required, role_required
from app.database import Database
import re

vehicles_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')

def log_action(user_id, action, description='', ip=None):
    try:
        Database.execute_query(
            """INSERT INTO activity_logs (user_id, action, description, ip_address)
               VALUES (%s, %s, %s, %s)""",
            (user_id, action, description, ip or '')
        )
    except Exception as e:
        print(f"[LOG ERROR] {e}")


# ── Véhicules actifs (avec infos propriétaire) ────────────────────
@vehicles_bp.route('/active', methods=['GET'])
@token_required
def get_active_vehicles():
    rows = Database.execute_query(
        """
        SELECT 
            p.id as id,
            p.entry_time as entry_time,
            p.exit_time as exit_time,
            p.expected_end_time as expected_end_time,
            p.license_plate as license_plate,
            p.spot_number as spot_number,
            p.status as status,
            p.vehicle_type as vehicle_type,
            IFNULL(u.name, 'Visiteur inconnu') AS owner_name,
            IFNULL(u.email, 'N/A') AS owner_email,
            'entry' as origin_type,
            p.entry_time as sort_time
        FROM parking_entries p
        LEFT JOIN vehicles v ON p.vehicle_id = v.id
        LEFT JOIN users u ON v.user_id = u.id

        UNION ALL

        SELECT 
            r.id as id,
            r.start_time as entry_time,
            r.end_time as exit_time,
            r.end_time as expected_end_time,
            r.license_plate as license_plate,
            r.place_number as spot_number,
            IF(NOW() BETWEEN r.start_time AND r.end_time, 'IN', 'OUT') as status,
            COALESCE(NULLIF(r.vehicle_type, ''), 'Voiture') as vehicle_type,
            COALESCE(NULLIF(r.nom_proche, ''), u.name) as owner_name,
            u.email as owner_email,
            'reservation' as origin_type,
            r.start_time as sort_time
        FROM reservations r
        JOIN users u ON r.user_id = u.id
        WHERE r.statut IN ('PENDING', 'VALIDATED', 'EXPIRED')

        ORDER BY 
            CASE status WHEN 'IN' THEN 1 ELSE 2 END ASC, 
            sort_time DESC 
        LIMIT 500
        """,
        fetch=True
    )
    result = []
    for row in (rows or []):
        r = dict(row)
        for col in ['entry_time', 'exit_time', 'expected_end_time', 'created_at']:
            val = r.get(col)
            if val and str(val) != 'None':
                r[col] = str(val).replace(' ', 'T')
            else:
                r[col] = None
        result.append(r)
    return jsonify({'data': result}), 200


# ✅ NOUVEAU : places occupées ou réservées en temps réel pour le plan de parking
@vehicles_bp.route('/occupied-spots', methods=['GET'])
@token_required
def get_occupied_spots():
    # 1. Récupérer les places physiquement occupées
    occupied_rows = Database.execute_query(
        "SELECT spot_number FROM parking_entries WHERE status = 'IN' AND spot_number IS NOT NULL AND spot_number != ''",
        fetch=True
    )
    
    # 2. Récupérer les places réservées (mais pas encore occupées)
    # On exclut celles qui sont déjà dans parking_entries pour éviter les doublons
    reserved_rows = Database.execute_query(
        """SELECT place_number AS spot_number 
           FROM reservations 
           WHERE statut IN ('PENDING', 'VALIDATED') 
           AND end_time >= NOW()
           AND place_number IS NOT NULL 
           AND place_number != ''""",
        fetch=True
    )
    
    # Fusionner les résultats
    all_spots = set()
    if occupied_rows:
        for r in occupied_rows:
            if r['spot_number']: all_spots.add(r['spot_number'])
            
    if reserved_rows:
        for r in reserved_rows:
            if r['spot_number']: all_spots.add(r['spot_number'])
            
    return jsonify(list(all_spots)), 200


@vehicles_bp.route('/capacity', methods=['GET'])
@token_required
def get_capacity():
    occupied = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM parking_entries WHERE status = 'IN'"
    )
    total = 160
    occ   = occupied['cnt'] if occupied else 0
    return jsonify({'occupied': occ, 'total': total, 'available': total - occ}), 200


@vehicles_bp.route('/entry', methods=['POST'])
@role_required(['ADMIN', 'MANAGER', 'AGENT', 'CLIENT'])
def vehicle_entry():
    data              = request.json or {}
    license_plate     = data.get('license_plate', '').upper().strip()
    vehicle_type      = data.get('vehicle_type', 'Voiture')
    spot_number       = data.get('spot_number', '').strip()
    expected_end_time = data.get('expected_end_time')
    if expected_end_time == '': expected_end_time = None
    agent_id          = request.user.get('user_id')

    # No forced regex transformation - allow spot_number to be exactly as provided (e.g. A-01, S-01)
    if not license_plate or not spot_number:
        return jsonify({'error': 'Plaque et place sont obligatoires'}), 400

    # Format plaque simple (lettres, chiffres, tirets)
    if not re.match(r'^[A-Z0-9-]{3,15}$', license_plate):
        return jsonify({'error': 'Format de plaque invalide (ex: AB-123-CD)'}), 400

    if len(spot_number) > 10:
        return jsonify({'error': 'Le numéro de place est trop long'}), 400

    existing = Database.execute_query_one(
        "SELECT id FROM parking_entries WHERE license_plate = %s AND status = 'IN'",
        (license_plate,)
    )
    if existing:
        return jsonify({'error': f'{license_plate} est déjà dans le parking'}), 409

    spot_taken = Database.execute_query_one(
        "SELECT license_plate FROM parking_entries WHERE spot_number = %s AND status = 'IN'",
        (spot_number,)
    )
    if spot_taken:
        return jsonify({'error': f'La place {spot_number} est déjà occupée (Active) par {spot_taken["license_plate"]}'}), 409

    # Vérifier l'overlap avec les réservations si on assigne un expected_end_time
    if expected_end_time:
        conflict = Database.execute_query_one(
            """SELECT id FROM reservations 
               WHERE place_number = %s AND statut IN ('PENDING', 'VALIDATED')
               AND start_time < %s AND end_time > NOW()""",
            (spot_number, expected_end_time)
        )
        if conflict:
            return jsonify({'error': f'La place {spot_number} a une réservation sur ce créneau'}), 409

    vehicle    = Database.execute_query_one(
        "SELECT id FROM vehicles WHERE license_plate = %s AND is_active = 1", (license_plate,)
    )
    vehicle_id = vehicle['id'] if vehicle else None

    entry_id = Database.execute_query(
        """INSERT INTO parking_entries
           (license_plate, vehicle_id, agent_id, spot_number, vehicle_type, status, expected_end_time)
           VALUES (%s, %s, %s, %s, %s, 'IN', %s)""",
        (license_plate, vehicle_id, agent_id, spot_number, vehicle_type, expected_end_time)
    )
    log_action(
        agent_id,
        'Entrée véhicule',
        f'{license_plate} entré place {spot_number}',
        request.remote_addr
    )
    return jsonify({'message': 'Entrée enregistrée', 'entry_id': entry_id, 'spot_number': spot_number}), 201


@vehicles_bp.route('/exit', methods=['POST'])
@role_required(['ADMIN', 'MANAGER', 'AGENT', 'CLIENT'])
def vehicle_exit():
    data          = request.json or {}
    license_plate = data.get('license_plate', '').upper().strip()

    if not license_plate:
        return jsonify({'error': 'Plaque obligatoire'}), 400

    entry = Database.execute_query_one(
        "SELECT * FROM parking_entries WHERE license_plate = %s AND status = 'IN' ORDER BY entry_time DESC LIMIT 1",
        (license_plate,)
    )
    if not entry:
        return jsonify({'error': f'Aucune entrée active pour {license_plate}'}), 404

    # Calculer le prix (simple: basé sur le tarif horaire)
    from datetime import datetime
    entry_time = entry['entry_time']
    if isinstance(entry_time, str):
        try:
            entry_time = datetime.strptime(entry_time, '%Y-%m-%d %H:%M:%S')
        except ValueError:
            entry_time = datetime.fromisoformat(entry_time)

    exit_time  = datetime.now()
    duration_seconds = (exit_time - entry_time).total_seconds()
    duration_hours   = max(1, int(duration_seconds / 3600) + (1 if duration_seconds % 3600 > 0 else 0))

    hourly_plan = Database.execute_query_one(
        "SELECT price FROM pricing_plans WHERE (name = 'hourly' OR label LIKE '%%horaire%%') AND is_active = 1 ORDER BY created_at DESC, id DESC LIMIT 1"
    )
    rate = float(hourly_plan['price']) if hourly_plan else 5.0
    price = duration_hours * rate

    Database.execute_query(
        "UPDATE parking_entries SET status = 'OUT', exit_time = %s, price = %s WHERE id = %s",
        (exit_time, price, entry['id'])
    )
    return jsonify({
        'message': 'Sortie enregistrée', 
        'entry_id': entry['id'],
        'price': price,
        'duration_hours': duration_hours
    }), 200


@vehicles_bp.route('/<int:entry_id>', methods=['DELETE'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def delete_entry(entry_id):
    entry = Database.execute_query_one("SELECT id FROM parking_entries WHERE id = %s", (entry_id,))
    if not entry:
        return jsonify({'error': 'Entrée introuvable'}), 404
    Database.execute_query("DELETE FROM parking_entries WHERE id = %s", (entry_id,))
    return jsonify({'message': 'Entrée supprimée'}), 200


@vehicles_bp.route('/<int:entry_id>', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def update_entry(entry_id):
    data = request.json or {}
    new_plate = data.get('license_plate', '').upper().strip()
    new_type = data.get('vehicle_type', '').strip()
    new_spot = data.get('spot_number', '').strip()
    new_end_time = data.get('expected_end_time')

    # No forced regex transformation - allow spot_number to be exactly as provided
    if not new_plate:
        return jsonify({'error': 'La nouvelle plaque est obligatoire'}), 400

    entry = Database.execute_query_one("SELECT * FROM parking_entries WHERE id = %s", (entry_id,))
    if not entry:
        return jsonify({'error': 'Entrée introuvable'}), 404

    # Update the entry
    Database.execute_query(
        "UPDATE parking_entries SET license_plate = %s, vehicle_type = %s, spot_number = %s, expected_end_time = %s WHERE id = %s",
        (new_plate, new_type if new_type else entry['vehicle_type'], new_spot if new_spot else entry['spot_number'], new_end_time if new_end_time else entry['expected_end_time'], entry_id)
    )

    # Optional: also update vehicles table if a corresponding vehicle exists
    if entry.get('vehicle_id'):
        Database.execute_query(
            "UPDATE vehicles SET license_plate = %s, vehicle_type = %s WHERE id = %s",
            (new_plate, new_type if new_type else entry['vehicle_type'], entry['vehicle_id'])
        )

    return jsonify({'message': 'Véhicule modifié avec succès'}), 200


@vehicles_bp.route('/<string:plate>/history', methods=['GET'])
@token_required
def get_vehicle_history(plate):
    rows = Database.execute_query(
        "SELECT * FROM parking_entries WHERE license_plate = %s ORDER BY entry_time DESC",
        (plate.upper(),), fetch=True
    )
    result = []
    for row in (rows or []):
        r = dict(row)
        if r.get('entry_time'): r['entry_time'] = str(r['entry_time'])
        if r.get('exit_time'):  r['exit_time']  = str(r['exit_time'])
        if r.get('created_at'): r['created_at'] = str(r['created_at'])
        result.append(r)
    return jsonify({'data': result}), 200