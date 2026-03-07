from flask import Blueprint, request, jsonify
from app.models import Vehicle
from app.utils import token_required, role_required

vehicles_bp = Blueprint('vehicles', __name__, url_prefix='/api/vehicles')

@vehicles_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def get_all_vehicles():
    """Get all vehicles"""
    vehicles = Vehicle.get_all()
    return jsonify(vehicles), 200

@vehicles_bp.route('/active', methods=['GET'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def get_active_vehicles():
    """Get currently parked vehicles"""
    vehicles = Vehicle.get_active_vehicles()
    return jsonify(vehicles), 200

@vehicles_bp.route('/<int:vehicle_id>', methods=['GET'])
@token_required
def get_vehicle(vehicle_id):
    """Get specific vehicle"""
    vehicle = Vehicle.get_by_id(vehicle_id)
    
    if not vehicle:
        return jsonify({'error': 'Vehicle not found'}), 404
    
    return jsonify(vehicle), 200

@vehicles_bp.route('/<plate>/history', methods=['GET'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def get_vehicle_history(plate):
    """Get vehicle parking history"""
    history = Vehicle.get_vehicle_history(plate)
    
    if not history:
        return jsonify({'error': 'No history found'}), 404
    
    return jsonify(history), 200

@vehicles_bp.route('/entry', methods=['POST'])
@role_required(['AGENT', 'ADMIN'])
def register_entry():
    """Register vehicle entry"""
    data = request.json
    
    if not data.get('license_plate') or not data.get('spot_number'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    Vehicle.entry(
        data['license_plate'],
        data['spot_number'],
        data.get('vehicle_type', 'Voiture')
    )
    
    return jsonify({
        'message': 'Vehicle entry recorded',
        'license_plate': data['license_plate'],
        'spot_number': data['spot_number']
    }), 201

@vehicles_bp.route('/exit', methods=['POST'])
@role_required(['AGENT', 'ADMIN'])
def register_exit():
    """Register vehicle exit"""
    data = request.json
    
    if not data.get('license_plate'):
        return jsonify({'error': 'License plate required'}), 400
    
    price = data.get('price', 0)
    Vehicle.exit(data['license_plate'], price)
    
    return jsonify({
        'message': 'Vehicle exit recorded',
        'license_plate': data['license_plate'],
        'price': price
    }), 201

@vehicles_bp.route('/create', methods=['POST'])
@token_required
def create_vehicle():
    """Create a new vehicle entry"""
    data = request.json
    
    if not data.get('license_plate'):
        return jsonify({'error': 'License plate required'}), 400
    
    # Check if vehicle already exists
    existing = Vehicle.get_by_plate(data['license_plate'])
    if existing:
        return jsonify({'error': 'Vehicle already exists'}), 409
    
    user_id = request.user.get('user_id') if request.user.get('role') == 'CLIENT' else None
    
    Vehicle.create(
        data['license_plate'],
        data.get('vehicle_type', 'Voiture'),
        user_id
    )
    
    return jsonify({
        'message': 'Vehicle created successfully',
        'license_plate': data['license_plate']
    }), 201
