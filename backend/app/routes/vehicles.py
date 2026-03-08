"""
app/routes/vehicles.py
Gestion des véhicules : CRUD + entrée/sortie avec calcul de prix automatique.
"""
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.models   import Vehicle
from app.utils    import token_required, role_required, CreateVehicleSchema, EntrySchema, ExitSchema
from app.services import ParkingService
from app.database import Database

vehicles_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')

_create_schema = CreateVehicleSchema()
_entry_schema  = EntrySchema()
_exit_schema   = ExitSchema()


# ── Liste avec pagination ────────────────────────────────────────

@vehicles_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def get_all_vehicles():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset   = (page - 1) * per_page

    vehicles = Database.execute_query(
        "SELECT * FROM vehicles WHERE is_active = TRUE ORDER BY created_at DESC LIMIT %s OFFSET %s",
        (per_page, offset), fetch=True
    )
    total = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM vehicles WHERE is_active = TRUE"
    )

    return jsonify({
        'data':     vehicles or [],
        'page':     page,
        'per_page': per_page,
        'total':    total['cnt'] if total else 0,
    }), 200


# ── Véhicules actuellement dans le parking ───────────────────────

@vehicles_bp.route('/active', methods=['GET'])
@token_required
def get_active_vehicles():
    rows = Database.execute_query(
        "SELECT * FROM parking_entries WHERE status = 'IN' ORDER BY entry_time DESC",
        fetch=True
    )
    return jsonify(rows or []), 200


# ── Capacité des places ──────────────────────────────────────────

@vehicles_bp.route('/capacity', methods=['GET'])
@token_required
def get_capacity():
    return jsonify(ParkingService.get_capacity_summary()), 200


# ── Créer un véhicule ────────────────────────────────────────────

@vehicles_bp.route('/create', methods=['POST'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def create_vehicle():
    try:
        data = _create_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({'error': 'Validation échouée', 'details': e.messages}), 400

    existing = Vehicle.get_by_plate(data['license_plate'])
    if existing:
        return jsonify({'error': 'Cette plaque est déjà enregistrée'}), 409

    Vehicle.create(
        data['license_plate'],
        data['vehicle_type'],
        data.get('user_id'),
        data.get('brand'),
        data.get('color'),
    )
    return jsonify({'message': 'Véhicule créé avec succès'}), 201


# ── Entrée ───────────────────────────────────────────────────────

@vehicles_bp.route('/entry', methods=['POST'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def vehicle_entry():
    try:
        data = _entry_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({'error': 'Validation échouée', 'details': e.messages}), 400

    try:
        result = ParkingService.register_entry(
            license_plate=data['license_plate'],
            vehicle_type=data.get('vehicle_type', 'Voiture'),
            agent_id=request.user.get('user_id'),
            spot_number=data.get('spot_number'),
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 409

    return jsonify({'message': 'Entrée enregistrée', **result}), 201


# ── Sortie ───────────────────────────────────────────────────────

@vehicles_bp.route('/exit', methods=['POST'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def vehicle_exit():
    try:
        data = _exit_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({'error': 'Validation échouée', 'details': e.messages}), 400

    try:
        result = ParkingService.register_exit(
            license_plate=data['license_plate'],
            payment_method=data.get('payment_method', 'CASH'),
        )
    except ValueError as e:
        return jsonify({'error': str(e)}), 404

    return jsonify({'message': 'Sortie enregistrée', **result}), 200


# ── Historique d'une plaque ──────────────────────────────────────

@vehicles_bp.route('/<string:plate>/history', methods=['GET'])
@token_required
def get_vehicle_history(plate):
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset   = (page - 1) * per_page

    rows = Database.execute_query(
        """SELECT * FROM parking_entries
           WHERE license_plate = %s
           ORDER BY entry_time DESC LIMIT %s OFFSET %s""",
        (plate.upper(), per_page, offset), fetch=True
    )
    return jsonify(rows or []), 200


# ── Soft delete d'un véhicule ────────────────────────────────────

@vehicles_bp.route('/<int:vehicle_id>', methods=['DELETE'])
@role_required(['ADMIN'])
def delete_vehicle(vehicle_id):
    v = Vehicle.get_by_id(vehicle_id)
    if not v:
        return jsonify({'error': 'Véhicule introuvable'}), 404

    Database.execute_query(
        "UPDATE vehicles SET is_active = FALSE WHERE id = %s", (vehicle_id,)
    )
    return jsonify({'message': 'Véhicule supprimé'}), 200
