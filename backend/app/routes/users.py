from flask import Blueprint, request, jsonify
from app.models import User
from app.utils import token_required, role_required

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

@users_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def get_all_users():
    """Get all users"""
    users = User.get_all()
    return jsonify(users), 200

@users_bp.route('/<int:user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    """Get specific user"""
    user = User.get_by_id(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Users can only view their own info, unless ADMIN
    if request.user.get('user_id') != user_id and request.user.get('role') != 'ADMIN':
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify({
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'role': user['role']
    }), 200

@users_bp.route('/<int:user_id>', methods=['PUT'])
@token_required
def update_user(user_id):
    """Update user information"""
    # Users can only update their own info, unless ADMIN
    if request.user.get('user_id') != user_id and request.user.get('role') != 'ADMIN':
        return jsonify({'error': 'Unauthorized'}), 403
    
    data = request.json
    User.update(user_id, **data)
    
    return jsonify({'message': 'User updated successfully'}), 200

@users_bp.route('/<int:user_id>', methods=['DELETE'])
@role_required(['ADMIN'])
def delete_user(user_id):
    """Delete user"""
    user = User.get_by_id(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    User.delete(user_id)
    return jsonify({'message': 'User deleted successfully'}), 200
