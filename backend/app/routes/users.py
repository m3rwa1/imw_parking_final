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

    rows = Database.execute_query(
        """SELECT id, name, email, role, is_active, created_at
           FROM users
           WHERE is_active = 1
           ORDER BY created_at DESC
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
        "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = %s",
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

    if not updates:
        return jsonify({'error': 'Aucun champ à modifier'}), 400

    params.append(user_id)
    Database.execute_query(
        f"UPDATE users SET {', '.join(updates)} WHERE id = %s",
        params
    )
    return jsonify({'message': 'Utilisateur mis à jour'}), 200


# ── Désactiver un utilisateur [ADMIN] ────────────────────────────
@users_bp.route('/<int:user_id>', methods=['DELETE'])
@role_required(['ADMIN'])
def delete_user(user_id):
    Database.execute_query(
        "UPDATE users SET is_active = 0 WHERE id = %s", (user_id,)
    )
    return jsonify({'message': 'Utilisateur désactivé'}), 200
