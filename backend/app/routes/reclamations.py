from flask import Blueprint, request, jsonify
from app.models import Reclamation
from app.utils import token_required, role_required

reclamations_bp = Blueprint('reclamations', __name__, url_prefix='/api/reclamations')

@reclamations_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def get_all_reclamations():
    """Get all reclamations"""
    reclamations = Reclamation.get_all()
    return jsonify(reclamations), 200

@reclamations_bp.route('/my-reclamations', methods=['GET'])
@token_required
def get_my_reclamations():
    """Get current user's reclamations"""
    user_id = request.user.get('user_id')
    reclamations = Reclamation.get_by_user(user_id)
    return jsonify(reclamations), 200

@reclamations_bp.route('/<int:rec_id>', methods=['GET'])
@token_required
def get_reclamation(rec_id):
    """Get specific reclamation"""
    rec = Reclamation.get_by_id(rec_id)
    
    if not rec:
        return jsonify({'error': 'Reclamation not found'}), 404
    
    # Check authorization
    if request.user.get('user_id') != rec['user_id'] and request.user.get('role') not in ['ADMIN', 'MANAGER', 'AGENT']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(rec), 200

@reclamations_bp.route('/create', methods=['POST'])
@token_required
def create_reclamation():
    """Create new reclamation"""
    data = request.json
    
    if not data.get('subject') or not data.get('description'):
        return jsonify({'error': 'Subject and description required'}), 400
    
    user_id = request.user.get('user_id')
    
    Reclamation.create(
        user_id,
        data['subject'],
        data['description'],
        'OPEN'
    )
    
    return jsonify({
        'message': 'Reclamation created successfully'
    }), 201

@reclamations_bp.route('/<int:rec_id>/status', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def update_reclamation_status(rec_id):
    """Update reclamation status"""
    data = request.json
    
    if not data.get('status'):
        return jsonify({'error': 'Status required'}), 400
    
    status = data.get('status')
    if status not in ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']:
        return jsonify({'error': 'Invalid status'}), 400
    
    Reclamation.update_status(rec_id, status)
    
    return jsonify({
        'message': 'Reclamation status updated',
        'status': status
    }), 200
