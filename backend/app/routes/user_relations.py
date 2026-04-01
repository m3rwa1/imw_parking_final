from flask import Blueprint, request, jsonify
from app.database import Database
from app.utils.auth import token_required, role_required

user_relations_bp = Blueprint('user_relations', __name__, url_prefix='/api/user_relations')


@user_relations_bp.route('/', methods=['GET'])
@role_required(['ADMIN','MANAGER'])
def list_relations():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))
    offset = (page - 1) * per_page
    rows = Database.execute_query(
        "SELECT ur.*, u.name as owner_name, p.name as proche_name FROM user_relations ur "
        "LEFT JOIN users u ON ur.user_id = u.id LEFT JOIN users p ON ur.proche_user_id = p.id "
        "ORDER BY ur.created_at DESC LIMIT %s OFFSET %s",
        (per_page, offset), fetch=True
    )
    return jsonify({'data': rows or []}), 200


@user_relations_bp.route('/', methods=['POST'])
@role_required(['ADMIN','MANAGER'])
def create_relation():
    data = request.get_json() or {}
    if not data.get('user_id') or not data.get('proche_user_id'):
        return jsonify({'error': 'user_id and proche_user_id required'}), 400
    Database.execute_query(
        "INSERT INTO user_relations (user_id, proche_user_id, relation_type) VALUES (%s, %s, %s)",
        (data['user_id'], data['proche_user_id'], data.get('relation_type', 'proche'))
    )
    return jsonify({'message': 'Relation created'}), 201


@user_relations_bp.route('/<int:id>', methods=['DELETE'])
@role_required(['ADMIN','MANAGER'])
def delete_relation(id):
    Database.execute_query("DELETE FROM user_relations WHERE id = %s", (id,))
    return jsonify({'message': 'Relation deleted'}), 200
