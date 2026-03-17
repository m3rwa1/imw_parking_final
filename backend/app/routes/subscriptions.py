"""
backend/app/routes/subscriptions.py
Compatible BD réelle : id, user_id, vehicle_id, license_plate, plan_type,
                       start_date, end_date, status, created_at
"""
from flask import Blueprint, request, jsonify
from app.utils    import token_required, role_required
from app.database import Database
from datetime import date, timedelta

subscriptions_bp = Blueprint('subscriptions', __name__, url_prefix='/api/subscriptions')


# ── Tous les abonnements [ADMIN/MANAGER] ──────────────────────────
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
           ORDER BY s.created_at DESC
           LIMIT %s OFFSET %s""",
        (per_page, offset), fetch=True
    )
    total = Database.execute_query_one("SELECT COUNT(*) AS cnt FROM subscriptions")

    result = []
    for row in (rows or []):
        r = dict(row)
        if r.get('start_date'): r['start_date'] = str(r['start_date'])
        if r.get('end_date'):   r['end_date']   = str(r['end_date'])
        if r.get('created_at'): r['created_at'] = str(r['created_at'])
        result.append(r)

    return jsonify({
        'data': result,
        'page': page,
        'per_page': per_page,
        'total': total['cnt'] if total else 0,
    }), 200


# ── Mes abonnements [CLIENT] ──────────────────────────────────────
@subscriptions_bp.route('/user', methods=['GET'])
@token_required
def get_my_subscriptions():
    user_id = request.user.get('user_id')
    rows = Database.execute_query(
        "SELECT * FROM subscriptions WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,), fetch=True
    )
    result = []
    for row in (rows or []):
        r = dict(row)
        if r.get('start_date'): r['start_date'] = str(r['start_date'])
        if r.get('end_date'):   r['end_date']   = str(r['end_date'])
        if r.get('created_at'): r['created_at'] = str(r['created_at'])
        result.append(r)
    return jsonify(result), 200


# ── Créer un abonnement ───────────────────────────────────────────
@subscriptions_bp.route('/create', methods=['POST'])
@token_required
def create_subscription():
    data    = request.json or {}
    user_id = request.user.get('user_id')

    license_plate = data.get('license_plate', '').upper()
    plan_type     = data.get('plan_type', 'MONTHLY')

    if not license_plate:
        return jsonify({'error': 'Plaque obligatoire'}), 400

    if plan_type not in ('HOURLY', 'DAILY', 'MONTHLY', 'ANNUAL'):
        return jsonify({'error': 'Type de plan invalide'}), 400

    # Calculer les dates automatiquement
    start_date = date.today()
    durations  = {'HOURLY': 1, 'DAILY': 1, 'MONTHLY': 30, 'ANNUAL': 365}
    end_date   = start_date + timedelta(days=durations.get(plan_type, 30))

    # Récupérer vehicle_id si existe
    vehicle = Database.execute_query_one(
        "SELECT id FROM vehicles WHERE license_plate = %s AND is_active = 1",
        (license_plate,)
    )
    vehicle_id = vehicle['id'] if vehicle else None

    # Vérifier si abonnement actif déjà existant
    existing = Database.execute_query_one(
        "SELECT id FROM subscriptions WHERE user_id = %s AND license_plate = %s AND status = 'ACTIVE'",
        (user_id, license_plate)
    )
    if existing:
        return jsonify({'error': 'Un abonnement actif existe déjà pour cette plaque'}), 409

    sub_id = Database.execute_query(
        """INSERT INTO subscriptions
           (user_id, vehicle_id, license_plate, plan_type, start_date, end_date, status)
           VALUES (%s, %s, %s, %s, %s, %s, 'ACTIVE')""",
        (user_id, vehicle_id, license_plate, plan_type, start_date, end_date)
    )

    return jsonify({
        'message': 'Abonnement créé avec succès',
        'subscription_id': sub_id,
        'start_date': str(start_date),
        'end_date': str(end_date),
    }), 201


# ── Mettre à jour le statut [ADMIN/MANAGER] ───────────────────────
@subscriptions_bp.route('/<int:sub_id>/status', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER'])
def update_status(sub_id):
    data   = request.json or {}
    status = data.get('status')

    if status not in ('ACTIVE', 'EXPIRED', 'CANCELLED'):
        return jsonify({'error': 'Statut invalide'}), 400

    Database.execute_query(
        "UPDATE subscriptions SET status = %s WHERE id = %s",
        (status, sub_id)
    )
    return jsonify({'message': 'Statut mis à jour'}), 200
