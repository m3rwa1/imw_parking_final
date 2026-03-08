"""
app/routes/spaces.py
Gestion des places de parking physiques.
"""
from flask import Blueprint, request, jsonify
from app.utils    import token_required, role_required
from app.database import Database

spaces_bp = Blueprint('spaces', __name__, url_prefix='/api/spaces')


@spaces_bp.route('/', methods=['GET'])
@token_required
def get_all_spaces():
    rows = Database.execute_query(
        "SELECT * FROM parking_spaces ORDER BY spot_number ASC",
        fetch=True
    )
    return jsonify(rows or []), 200


@spaces_bp.route('/available', methods=['GET'])
@token_required
def get_available():
    vehicle_type = request.args.get('type', None)
    if vehicle_type:
        rows = Database.execute_query(
            "SELECT * FROM parking_spaces WHERE is_available = TRUE AND space_type = %s",
            (vehicle_type,), fetch=True
        )
    else:
        rows = Database.execute_query(
            "SELECT * FROM parking_spaces WHERE is_available = TRUE ORDER BY spot_number",
            fetch=True
        )
    return jsonify(rows or []), 200


@spaces_bp.route('/create', methods=['POST'])
@role_required(['ADMIN'])
def create_space():
    data = request.get_json() or {}
    spot  = data.get('spot_number', '').strip().upper()
    stype = data.get('space_type', 'Voiture')
    floor = data.get('floor', 0)

    if not spot:
        return jsonify({'error': 'spot_number requis'}), 400

    Database.execute_query(
        "INSERT INTO parking_spaces (spot_number, space_type, floor) VALUES (%s, %s, %s)",
        (spot, stype, floor)
    )
    return jsonify({'message': f'Place {spot} créée'}), 201


@spaces_bp.route('/<string:spot_number>', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER'])
def update_space(spot_number):
    data = request.get_json() or {}
    Database.execute_query(
        """UPDATE parking_spaces
           SET is_available = %s, is_reserved = %s
           WHERE spot_number = %s""",
        (data.get('is_available', True), data.get('is_reserved', False), spot_number.upper())
    )
    return jsonify({'message': 'Place mise à jour'}), 200
