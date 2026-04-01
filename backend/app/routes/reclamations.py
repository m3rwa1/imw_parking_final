"""
backend/app/routes/reclamations.py
Compatible avec la BD réelle : id, user_id, subject, description, status, resolved_by, created_at
"""
from flask import Blueprint, request, jsonify
from app.utils    import token_required, role_required
from app.database import Database

reclamations_bp = Blueprint('reclamations', __name__, url_prefix='/api/reclamations')


# ── Toutes les réclamations [ADMIN/MANAGER] ───────────────────────
@reclamations_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def get_all():
    page          = int(request.args.get('page', 1))
    per_page      = int(request.args.get('per_page', 50))
    offset        = (page - 1) * per_page

    # ✅ Par défaut on exclut RESOLVED et CLOSED
    # Passer ?show_resolved=true pour tout voir
    show_resolved = request.args.get('show_resolved', 'false').lower() == 'true'

    if show_resolved:
        where  = ""
        params = (per_page, offset)
        count_query = "SELECT COUNT(*) AS cnt FROM reclamations"
        count_params = ()
    else:
        where  = "WHERE r.status NOT IN ('RESOLVED', 'CLOSED')"
        params = (per_page, offset)
        count_query = "SELECT COUNT(*) AS cnt FROM reclamations WHERE status NOT IN ('RESOLVED', 'CLOSED')"
        count_params = ()

    rows = Database.execute_query(
        f"""SELECT r.*, u.name AS user_name
           FROM reclamations r
           JOIN users u ON r.user_id = u.id
           {where}
           ORDER BY r.created_at DESC
           LIMIT %s OFFSET %s""",
        params, fetch=True
    )
    total = Database.execute_query_one(count_query)

    result = []
    for row in (rows or []):
        r = dict(row)
        if r.get('created_at'): r['created_at'] = str(r['created_at'])
        result.append(r)

    return jsonify({
        'data':     result,
        'page':     page,
        'per_page': per_page,
        'total':    total['cnt'] if total else 0,
    }), 200


# ── Mes réclamations [CLIENT] ────────────────────────────────────
@reclamations_bp.route('/my-reclamations', methods=['GET'])
@token_required
def my_reclamations():
    user_id = request.user.get('user_id')
    rows = Database.execute_query(
        "SELECT * FROM reclamations WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,), fetch=True
    )
    result = []
    for row in (rows or []):
        r = dict(row)
        if r.get('created_at'): r['created_at'] = str(r['created_at'])
        result.append(r)
    return jsonify({'data': result}), 200


# ── Créer une réclamation ─────────────────────────────────────────
@reclamations_bp.route('/create', methods=['POST'])
@token_required
def create_reclamation():
    data    = request.json or {}
    user_id = request.user.get('user_id')

    subject     = data.get('subject', '').strip()
    description = data.get('description', '').strip()

    if not subject or not description:
        return jsonify({'error': 'Sujet et description sont obligatoires'}), 400

    rec_id = Database.execute_query(
        "INSERT INTO reclamations (user_id, subject, description, status) VALUES (%s, %s, %s, 'OPEN')",
        (user_id, subject, description)
    )

    return jsonify({
        'message':        'Réclamation soumise avec succès',
        'reclamation_id': rec_id,
    }), 201


# ── Mettre à jour le statut [ADMIN/MANAGER] ───────────────────────
@reclamations_bp.route('/<int:rec_id>/status', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER'])
def update_status(rec_id):
    data   = request.json or {}
    status = data.get('status')

    if status not in ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'):
        return jsonify({'error': 'Statut invalide'}), 400

    resolver_id = request.user.get('user_id')

    if status in ('RESOLVED', 'CLOSED'):
        Database.execute_query(
            "UPDATE reclamations SET status = %s, resolved_by = %s WHERE id = %s",
            (status, resolver_id, rec_id)
        )
    else:
        Database.execute_query(
            "UPDATE reclamations SET status = %s WHERE id = %s",
            (status, rec_id)
        )

    return jsonify({'message': 'Statut mis à jour'}), 200

# ── Vider toutes les réclamations [ADMIN] ──────────────────────────
@reclamations_bp.route('/clear-all', methods=['DELETE'])
@role_required(['ADMIN'])
def clear_all():
    Database.execute_query("DELETE FROM reclamations")
    return jsonify({'message': 'Toutes les réclamations ont été supprimées'}), 200