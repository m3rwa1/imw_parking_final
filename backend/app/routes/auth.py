from flask import Blueprint, request, jsonify
from app.models import User
from app.utils import AuthHelper, token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.json
    
    if not data.get('email') or not data.get('password') or not data.get('name'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Check if user already exists
    existing_user = User.get_by_email(data['email'])
    if existing_user:
        return jsonify({'error': 'User already exists'}), 409
    
    # Create user (default role is CLIENT)
    role = data.get('role', 'CLIENT')
    if role not in ['ADMIN', 'MANAGER', 'AGENT', 'CLIENT']:
        role = 'CLIENT'
    
    User.create(data['name'], data['email'], data['password'], role)
    
    return jsonify({
        'message': 'User created successfully',
        'role': role
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    """Login user"""
    data = request.json
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Missing email or password'}), 400
    
    user = User.get_by_email(data['email'])
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Verify password
    if not AuthHelper.verify_password(data['password'], user['password']):
        return jsonify({'error': 'Invalid credentials'}), 401
    
    # Create token
    token = AuthHelper.create_token(user['id'], user['email'], user['role'])
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role']
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    """Get current user information"""
    user_id = request.user.get('user_id')
    user = User.get_by_id(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'role': user['role']
    }), 200
