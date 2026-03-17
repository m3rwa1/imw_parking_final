"""
backend/app/routes/vehicles.py — Version finale
Places occupées calculées depuis parking_entries en temps réel
"""
from flask import Blueprint, request, jsonify
from app.utils    import token_required, role_required
from app.database import Database

vehicles_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')


@vehicles_bp.route('/active', methods=['GET'])
@token_required
def get_active_vehicles():
    rows = Database.execute_query(
        "SELECT * FROM parking_entries WHERE status = 'IN' ORDER BY entry_time DESC",
        fetch=True
    )
    result = []
    for row in (rows or []):
        r = dict(row)
        if r.get('entry_time'): r['entry_time'] = str(r['entry_time'])
        if r.get('exit_time'):  r['exit_time']  = str(r['exit_time'])
        if r.get('created_at'): r['created_at'] = str(r['created_at'])
        result.append(r)
    return jsonify(result), 200


# ✅ NOUVEAU : places occupées en temps réel pour le plan de parking
@vehicles_bp.route('/occupied-spots', methods=['GET'])
@token_required
def get_occupied_spots():
    rows = Database.execute_query(
        """SELECT spot_number, license_plate, vehicle_type, entry_time
           FROM parking_entries
           WHERE status = 'IN' AND spot_number IS NOT NULL AND spot_number != ''
           ORDER BY entry_time DESC""",
        fetch=True
    )
    result = []
    for row in (rows or []):
        r = dict(row)
        if r.get('entry_time'): r['entry_time'] = str(r['entry_time'])
        result.append(r)
    return jsonify(result), 200


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
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def vehicle_entry():
    data          = request.json or {}
    license_plate = data.get('license_plate', '').upper().strip()
    vehicle_type  = data.get('vehicle_type', 'Voiture')
    spot_number   = data.get('spot_number', '').strip()
    agent_id      = request.user.get('user_id')

    if not license_plate or not spot_number:
        return jsonify({'error': 'Plaque et place sont obligatoires'}), 400

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
        return jsonify({'error': f'La place {spot_number} est déjà occupée par {spot_taken["license_plate"]}'}), 409

    vehicle    = Database.execute_query_one(
        "SELECT id FROM vehicles WHERE license_plate = %s AND is_active = 1", (license_plate,)
    )
    vehicle_id = vehicle['id'] if vehicle else None

    entry_id = Database.execute_query(
        """INSERT INTO parking_entries
           (license_plate, vehicle_id, agent_id, spot_number, vehicle_type, status)
           VALUES (%s, %s, %s, %s, %s, 'IN')""",
        (license_plate, vehicle_id, agent_id, spot_number, vehicle_type)
    )
    return jsonify({'message': 'Entrée enregistrée', 'entry_id': entry_id, 'spot_number': spot_number}), 201


@vehicles_bp.route('/exit', methods=['POST'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
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

    Database.execute_query(
        "UPDATE parking_entries SET status = 'OUT', exit_time = NOW() WHERE id = %s",
        (entry['id'],)
    )
    return jsonify({'message': 'Sortie enregistrée', 'entry_id': entry['id']}), 200


@vehicles_bp.route('/<int:entry_id>', methods=['DELETE'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def delete_entry(entry_id):
    entry = Database.execute_query_one("SELECT id FROM parking_entries WHERE id = %s", (entry_id,))
    if not entry:
        return jsonify({'error': 'Entrée introuvable'}), 404
    Database.execute_query("DELETE FROM parking_entries WHERE id = %s", (entry_id,))
    return jsonify({'message': 'Entrée supprimée'}), 200


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
    return jsonify(result), 200