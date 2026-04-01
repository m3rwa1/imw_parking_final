"""
backend/app/routes/logs.py
Gestion des logs système depuis la table activity_logs
Colonnes : id, user_id, action, description, ip_address, user_agent, created_at
"""
from flask import Blueprint, request, jsonify
from app.utils    import token_required, role_required
from app.database import Database

logs_bp = Blueprint('logs', __name__, url_prefix='/api/logs')


# ── Lire tous les logs [ADMIN] ────────────────────────────────────
@logs_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def get_all():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    offset   = (page - 1) * per_page

    rows = Database.execute_query(
        """SELECT l.*, u.name AS user_name, u.role AS user_role
           FROM activity_logs l
           LEFT JOIN users u ON l.user_id = u.id
           WHERE u.role IN ('ADMIN', 'MANAGER', 'AGENT')
             AND l.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
           ORDER BY l.created_at DESC
           LIMIT %s OFFSET %s""",
        (per_page, offset), fetch=True
    )

    total = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM activity_logs l LEFT JOIN users u ON l.user_id = u.id WHERE u.role IN ('ADMIN', 'MANAGER', 'AGENT') AND l.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"
    )

    result = []
    for row in (rows or []):
        r = dict(row)
        if r.get('created_at'):
            r['created_at'] = str(r['created_at'])
        result.append(r)

    return jsonify({
        'data':     result,
        'total':    total['cnt'] if total else 0,
        'page':     page,
        'per_page': per_page,
    }), 200


# ── Enregistrer un log (usage interne) ───────────────────────────
@logs_bp.route('/add', methods=['POST'])
@token_required
def add_log():
    data        = request.json or {}
    user_id     = request.user.get('user_id')
    action      = data.get('action', '').strip()
    description = data.get('description', '').strip()
    ip_address  = request.remote_addr

    if not action:
        return jsonify({'error': 'Action requise'}), 400

    Database.execute_query(
        """INSERT INTO activity_logs (user_id, action, description, ip_address)
           VALUES (%s, %s, %s, %s)""",
        (user_id, action, description, ip_address)
    )

    return jsonify({'message': 'Log enregistré'}), 201

# ── Vider tous les logs [ADMIN] ───────────────────────────────────
@logs_bp.route('/clear-all', methods=['DELETE'])
@role_required(['ADMIN'])
def clear_all():
    Database.execute_query("DELETE FROM activity_logs")
    return jsonify({'message': 'Tous les logs ont été supprimés'}), 200