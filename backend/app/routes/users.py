"""
backend/app/routes/users.py
Compatible BD réelle : id, name, email, password, role, is_active, created_at
"""
from flask import Blueprint, request, jsonify
from app.utils    import token_required, role_required
from app.database import Database

users_bp = Blueprint('users', __name__, url_prefix='/api/users')


# ── Tous les utilisateurs [ADMIN] ─────────────────────────────────
@users_bp.route('/', methods=['GET'])
@role_required(['ADMIN'])
def get_all():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset   = (page - 1) * per_page

    # Auto-expiration des abonnements
    Database.execute_query("UPDATE subscriptions SET status = 'EXPIRED' WHERE status = 'ACTIVE' AND end_date < CURDATE()")

    rows = Database.execute_query(
        """SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
                  GROUP_CONCAT(DISTINCT v.license_plate SEPARATOR ', ') AS license_plates,
                  MAX(CASE WHEN s.status = 'ACTIVE' AND s.end_date >= CURDATE() THEN 1 ELSE 0 END) AS has_active_sub
           FROM users u
           LEFT JOIN vehicles v ON u.id = v.user_id
           LEFT JOIN subscriptions s ON u.id = s.user_id
           WHERE u.is_active = 1
           GROUP BY u.id
           ORDER BY u.created_at DESC
           LIMIT %s OFFSET %s""",
        (per_page, offset), fetch=True
    )
    total = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM users WHERE is_active = 1"
    )

    result = []
    for row in (rows or []):
        r = dict(row)
        if r.get('created_at'): r['created_at'] = str(r['created_at'])
        # For single license plate display, take the first one
        r['license_plate'] = r.get('license_plates', '').split(', ')[0] if r.get('license_plates') else None
        result.append(r)

    return jsonify({
        'data': result,
        'total': total['cnt'] if total else 0,
    }), 200


# ── Un utilisateur par ID ─────────────────────────────────────────
@users_bp.route('/<int:user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    row = Database.execute_query_one(
        """SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
                  MAX(CASE WHEN s.status = 'ACTIVE' AND s.end_date >= CURDATE() THEN 1 ELSE 0 END) AS has_active_sub
           FROM users u
           LEFT JOIN subscriptions s ON u.id = s.user_id
           WHERE u.id = %s
           GROUP BY u.id""",
        (user_id,)
    )
    if not row:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    r = dict(row)
    if r.get('created_at'): r['created_at'] = str(r['created_at'])
    return jsonify(r), 200


# ── Modifier un utilisateur [ADMIN] ──────────────────────────────
@users_bp.route('/<int:user_id>', methods=['PUT'])
@role_required(['ADMIN'])
def update_user(user_id):
    data = request.json or {}

    allowed = ['name', 'email', 'role']
    updates, params = [], []
    for key in allowed:
        if key in data:
            updates.append(f"{key} = %s")
            params.append(data[key])

    if not updates and 'license_plate' not in data:
        return jsonify({'error': 'Aucun champ à modifier'}), 400

    if updates:
        params.append(user_id)
        Database.execute_query(
            f"UPDATE users SET {', '.join(updates)} WHERE id = %s",
            params
        )

    # Gérer la mise à jour de la plaque d'immatriculation
    if 'license_plate' in data and data['license_plate']:
        plate = data['license_plate'].upper().strip()
        vehicle = Database.execute_query_one(
            "SELECT id FROM vehicles WHERE user_id = %s AND is_active = 1", (user_id,)
        )
        if vehicle:
            Database.execute_query(
                "UPDATE vehicles SET license_plate = %s WHERE id = %s", (plate, vehicle['id'])
            )
        else:
            Database.execute_query(
                "INSERT INTO vehicles (license_plate, vehicle_type, user_id) VALUES (%s, 'Voiture', %s)",
                (plate, user_id)
            )

    return jsonify({'message': 'Utilisateur mis à jour'}), 200


# ── Désactiver TOUS les utilisateurs excepté ADMIN [ADMIN] ─────
@users_bp.route('/clear-all', methods=['DELETE'])
@role_required(['ADMIN'])
def clear_all_users():
    # On ne désactive pas l'admin lui-même
    Database.execute_query(
        "UPDATE users SET is_active = 0 WHERE role != 'ADMIN'"
    )
    return jsonify({'message': 'Tous les utilisateurs non-admins ont été désactivés'}), 200


# ── Désactiver un utilisateur [ADMIN] ────────────────────────────
@users_bp.route('/<int:user_id>', methods=['DELETE'])
@role_required(['ADMIN'])
def delete_user(user_id):
    Database.execute_query(
        "UPDATE users SET is_active = 0 WHERE id = %s", (user_id,)
    )
    return jsonify({'message': 'Utilisateur désactivé'}), 200
