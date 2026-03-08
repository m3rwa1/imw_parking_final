"""
app/routes/subscriptions.py
Gestion des abonnements avec expiration automatique.
"""
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.utils    import token_required, role_required, CreateSubscriptionSchema
from app.services import SubscriptionService
from app.database import Database

subscriptions_bp = Blueprint('subscriptions', __name__, url_prefix='/api/subscriptions')

_create_schema = CreateSubscriptionSchema()


@subscriptions_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def get_all():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset   = (page - 1) * per_page

    rows = Database.execute_query(
        """SELECT s.*, u.name AS user_name, u.email AS user_email
           FROM subscriptions s
           JOIN users u ON s.user_id = u.id
           ORDER BY s.created_at DESC LIMIT %s OFFSET %s""",
        (per_page, offset), fetch=True
    )
    total = Database.execute_query_one("SELECT COUNT(*) AS cnt FROM subscriptions")
    return jsonify({
        'data':     rows or [],
        'page':     page,
        'per_page': per_page,
        'total':    total['cnt'] if total else 0,
    }), 200


@subscriptions_bp.route('/user', methods=['GET'])
@token_required
def get_my_subscriptions():
    user_id = request.user.get('user_id')
    rows = Database.execute_query(
        "SELECT * FROM subscriptions WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,), fetch=True
    )
    return jsonify(rows or []), 200


@subscriptions_bp.route('/<int:sub_id>', methods=['GET'])
@token_required
def get_subscription(sub_id):
    row = Database.execute_query_one(
        "SELECT * FROM subscriptions WHERE id = %s", (sub_id,)
    )
    if not row:
        return jsonify({'error': 'Abonnement introuvable'}), 404

    # Clients ne voient que les leurs
    if request.user.get('role') == 'CLIENT' and row['user_id'] != request.user.get('user_id'):
        return jsonify({'error': 'Accès refusé'}), 403

    return jsonify(row), 200


@subscriptions_bp.route('/create', methods=['POST'])
@token_required
def create_subscription():
    try:
        data = _create_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({'error': 'Validation échouée', 'details': e.messages}), 400

    user_id = request.user.get('user_id')

    sub_id = SubscriptionService.create(
        user_id=user_id,
        license_plate=data['license_plate'],
        plan_type=data['plan_type'],
        start_date=data['start_date'],
        end_date=data['end_date'],
        vehicle_id=data.get('vehicle_id'),
        notes=data.get('notes'),
    )
    return jsonify({
        'message':         'Abonnement créé avec succès',
        'subscription_id': sub_id,
        'price':           SubscriptionService.get_price_for_plan(data['plan_type']),
    }), 201


@subscriptions_bp.route('/<int:sub_id>/status', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER'])
def update_status(sub_id):
    data   = request.get_json() or {}
    status = data.get('status')

    if status not in ('ACTIVE', 'EXPIRED', 'CANCELLED'):
        return jsonify({'error': 'Statut invalide'}), 400

    Database.execute_query(
        "UPDATE subscriptions SET status = %s WHERE id = %s", (status, sub_id)
    )
    return jsonify({'message': 'Statut mis à jour'}), 200


@subscriptions_bp.route('/expire', methods=['POST'])
@role_required(['ADMIN'])
def force_expire():
    """Force l'expiration immédiate (normalement gérée par le scheduler)."""
    count = SubscriptionService.expire_old_subscriptions()
    return jsonify({'message': f'{count} abonnement(s) expiré(s)'}), 200
