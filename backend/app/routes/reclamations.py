"""
app/routes/reclamations.py
Gestion des réclamations avec suivi de résolution.
"""
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.utils    import token_required, role_required, CreateReclamationSchema, UpdateReclamationSchema
from app.database import Database

reclamations_bp = Blueprint('reclamations', __name__, url_prefix='/api/reclamations')

_create_schema = CreateReclamationSchema()
_update_schema = UpdateReclamationSchema()


@reclamations_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def get_all():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset   = (page - 1) * per_page
    status   = request.args.get('status')

    if status:
        rows = Database.execute_query(
            """SELECT r.*, u.name AS user_name
               FROM reclamations r JOIN users u ON r.user_id = u.id
               WHERE r.status = %s ORDER BY r.created_at DESC LIMIT %s OFFSET %s""",
            (status, per_page, offset), fetch=True
        )
    else:
        rows = Database.execute_query(
            """SELECT r.*, u.name AS user_name
               FROM reclamations r JOIN users u ON r.user_id = u.id
               ORDER BY r.created_at DESC LIMIT %s OFFSET %s""",
            (per_page, offset), fetch=True
        )

    total = Database.execute_query_one("SELECT COUNT(*) AS cnt FROM reclamations")
    return jsonify({
        'data': rows or [], 'page': page, 'per_page': per_page,
        'total': total['cnt'] if total else 0,
    }), 200


@reclamations_bp.route('/my-reclamations', methods=['GET'])
@token_required
def my_reclamations():
    user_id = request.user.get('user_id')
    rows = Database.execute_query(
        "SELECT * FROM reclamations WHERE user_id = %s ORDER BY created_at DESC",
        (user_id,), fetch=True
    )
    return jsonify(rows or []), 200


@reclamations_bp.route('/<int:rec_id>', methods=['GET'])
@token_required
def get_reclamation(rec_id):
    row = Database.execute_query_one(
        "SELECT * FROM reclamations WHERE id = %s", (rec_id,)
    )
    if not row:
        return jsonify({'error': 'Réclamation introuvable'}), 404

    if request.user.get('role') == 'CLIENT' and row['user_id'] != request.user.get('user_id'):
        return jsonify({'error': 'Accès refusé'}), 403

    return jsonify(row), 200


@reclamations_bp.route('/create', methods=['POST'])
@token_required
def create_reclamation():
    try:
        data = _create_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({'error': 'Validation échouée', 'details': e.messages}), 400

    rec_id = Database.execute_query(
        "INSERT INTO reclamations (user_id, subject, description) VALUES (%s, %s, %s)",
        (request.user.get('user_id'), data['subject'], data['description'])
    )
    return jsonify({'message': 'Réclamation soumise', 'reclamation_id': rec_id}), 201


@reclamations_bp.route('/<int:rec_id>/status', methods=['PUT'])
@role_required(['ADMIN', 'MANAGER'])
def update_status(rec_id):
    try:
        data = _update_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({'error': 'Validation échouée', 'details': e.messages}), 400

    resolver_id = request.user.get('user_id')
    new_status  = data['status']

    if new_status in ('RESOLVED', 'CLOSED'):
        Database.execute_query(
            """UPDATE reclamations
               SET status = %s, resolved_by = %s, resolved_at = NOW()
               WHERE id = %s""",
            (new_status, resolver_id, rec_id)
        )
    else:
        Database.execute_query(
            "UPDATE reclamations SET status = %s WHERE id = %s",
            (new_status, rec_id)
        )

    return jsonify({'message': 'Statut mis à jour'}), 200
