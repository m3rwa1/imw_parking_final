from flask import Blueprint, request, jsonify
from app.models import Subscription
from app.utils import token_required, role_required

subscriptions_bp = Blueprint('subscriptions', __name__, url_prefix='/api/subscriptions')

@subscriptions_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def get_all_subscriptions():
    """Get all subscriptions"""
    subscriptions = Subscription.get_all()
    return jsonify(subscriptions), 200

@subscriptions_bp.route('/user', methods=['GET'])
@token_required
def get_user_subscriptions():
    """Get current user's subscriptions"""
    user_id = request.user.get('user_id')
    subscriptions = Subscription.get_by_user(user_id)
    return jsonify(subscriptions), 200

@subscriptions_bp.route('/<int:sub_id>', methods=['GET'])
@token_required
def get_subscription(sub_id):
    """Get specific subscription"""
    sub = Subscription.get_by_id(sub_id)
    
    if not sub:
        return jsonify({'error': 'Subscription not found'}), 404
    
    # Check authorization
    if request.user.get('user_id') != sub['user_id'] and request.user.get('role') != 'ADMIN':
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(sub), 200

@subscriptions_bp.route('/create', methods=['POST'])
@token_required
def create_subscription():
    """Create new subscription"""
    data = request.json
    
    if not data.get('vehicle_id') or not data.get('license_plate') or not data.get('plan_type'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    plan_type = data.get('plan_type')
    if plan_type not in ['HOURLY', 'MONTHLY', 'ANNUAL']:
        return jsonify({'error': 'Invalid plan type'}), 400
    
    user_id = request.user.get('user_id')
    
    Subscription.create(
        user_id,
        data['vehicle_id'],
        data['license_plate'],
        plan_type,
        data.get('start_date'),
        data.get('end_date')
    )
    
    return jsonify({
        'message': 'Subscription created successfully',
        'plan_type': plan_type
    }), 201

@subscriptions_bp.route('/<int:sub_id>/status', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER'])
def update_subscription_status(sub_id):
    """Update subscription status"""
    data = request.json
    
    if not data.get('status'):
        return jsonify({'error': 'Status required'}), 400
    
    status = data.get('status')
    if status not in ['ACTIVE', 'EXPIRED', 'CANCELLED']:
        return jsonify({'error': 'Invalid status'}), 400
    
    Subscription.update_status(sub_id, status)
    
    return jsonify({
        'message': 'Subscription status updated',
        'status': status
    }), 200
