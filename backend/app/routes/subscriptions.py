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

def log_action(user_id, action, description='', ip=None):
    try:
        Database.execute_query(
            """INSERT INTO activity_logs (user_id, action, description, ip_address)
               VALUES (%s, %s, %s, %s)""",
            (user_id, action, description, ip or '')
        )
    except Exception as e:
        print(f"[LOG ERROR] {e}")


# ── Tous les abonnements [ADMIN/MANAGER] ──────────────────────────
@subscriptions_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def get_all():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset   = (page - 1) * per_page

    # Auto-expiration des abonnements
    Database.execute_query("UPDATE subscriptions SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND end_date < CURDATE()")

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
    # Auto-expiration des abonnements
    Database.execute_query("UPDATE subscriptions SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND end_date < CURDATE()")

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
    return jsonify({'data': result}), 200


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

    # Calculer les dates ou utiliser celles du payload
    if 'start_date' in data and 'end_date' in data:
        start_date = data['start_date'][:10]  # format ISO ou YYYY-MM-DD
        end_date = data['end_date'][:10]
    else:
        start_date_obj = date.today()
        durations  = {'HOURLY': 1, 'DAILY': 1, 'MONTHLY': 30, 'ANNUAL': 365}
        end_date_obj   = start_date_obj + timedelta(days=durations.get(plan_type, 30))
        start_date = start_date_obj.isoformat()
        end_date = end_date_obj.isoformat()

    # Récupérer vehicle_id si existe
    vehicle = Database.execute_query_one(
        "SELECT id FROM vehicles WHERE license_plate = %s AND is_active = 1",
        (license_plate,)
    )
    vehicle_id = vehicle['id'] if vehicle else None

    # Vérifier si abonnement actif ou pending déjà existant
    existing = Database.execute_query_one(
        "SELECT id FROM subscriptions WHERE user_id = %s AND license_plate = %s AND status IN ('ACTIVE','PENDING')",
        (user_id, license_plate)
    )
    if existing:
        return jsonify({'error': 'Un abonnement actif ou en attente existe déjà pour cette plaque'}), 409

    # Les abonnements premium/annual nécessitent l'approbation admin
    initial_status = 'PENDING' if plan_type in ('MONTHLY', 'ANNUAL') else 'ACTIVE'

    sub_id = Database.execute_query(
        """INSERT INTO subscriptions
           (user_id, vehicle_id, license_plate, plan_type, start_date, end_date, status)
           VALUES (%s, %s, %s, %s, %s, %s, %s)""",
        (user_id, vehicle_id, license_plate, plan_type, start_date, end_date, initial_status)
    )

    return jsonify({
        'message': 'Demande d\'abonnement enregistrée' if initial_status == 'PENDING' else 'Abonnement créé avec succès',
        'subscription_id': sub_id,
        'status': initial_status,
        'start_date': str(start_date),
        'end_date': str(end_date),
    }), 201


# ── Mettre à jour le statut [ADMIN/MANAGER] ───────────────────────
@subscriptions_bp.route('/<int:sub_id>/status', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def update_status(sub_id):
    data   = request.json or {}
    status = data.get('status')

    if status not in ('ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING'):
        return jsonify({'error': 'Statut invalide'}), 400

    Database.execute_query(
        "UPDATE subscriptions SET status = %s WHERE id = %s",
        (status, sub_id)
    )
    log_action(
        request.user.get('user_id'),
        f'Abonnement {status}',
        f'Abonnement #{sub_id} mis à jour vers {status}',
        request.remote_addr
    )
    return jsonify({'message': 'Statut mis à jour'}), 200

# ── Supprimer un abonnement [ADMIN/MANAGER] ────────────────────────
@subscriptions_bp.route('/<int:sub_id>', methods=['DELETE'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def delete_subscription(sub_id):
    Database.execute_query("DELETE FROM subscriptions WHERE id = %s", (sub_id,))
    log_action(
        request.user.get('user_id'),
        'Suppression abonnement',
        f'Abonnement #{sub_id} supprimé',
        request.remote_addr
    )
    return jsonify({'message': 'Abonnement supprimé avec succès'}), 200
