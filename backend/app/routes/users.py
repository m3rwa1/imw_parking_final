"""
app/routes/users.py
Gestion des utilisateurs avec soft delete et pagination.
"""
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.models  import User
from app.utils   import token_required, role_required, UpdateUserSchema
from app.database import Database

users_bp = Blueprint('users', __name__, url_prefix='/api/users')

_update_schema = UpdateUserSchema()


@users_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def get_all_users():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))

    users = User.get_all(page=page, per_page=per_page)
    total = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM users WHERE is_active = TRUE"
    )
    return jsonify({
        'data':     users or [],
        'page':     page,
        'per_page': per_page,
        'total':    total['cnt'] if total else 0,
    }), 200


@users_bp.route('/<int:user_id>', methods=['GET'])
@token_required
def get_user(user_id):
    if request.user.get('user_id') != user_id and request.user.get('role') not in ('ADMIN', 'MANAGER'):
        return jsonify({'error': 'Accès refusé'}), 403

    user = User.get_by_id(user_id)
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    return jsonify({
        'id':         user['id'],
        'name':       user['name'],
        'email':      user['email'],
        'role':       user['role'],
        'phone':      user.get('phone'),
        'last_login': str(user.get('last_login', '')),
        'created_at': str(user.get('created_at', '')),
    }), 200


@users_bp.route('/<int:user_id>', methods=['PUT'])
@token_required
def update_user(user_id):
    if request.user.get('user_id') != user_id and request.user.get('role') != 'ADMIN':
        return jsonify({'error': 'Accès refusé'}), 403

    try:
        data = _update_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({'error': 'Validation échouée', 'details': e.messages}), 400

    # Seul un ADMIN peut changer le rôle
    if 'role' in data and request.user.get('role') != 'ADMIN':
        del data['role']

    User.update(user_id, **data)
    return jsonify({'message': 'Profil mis à jour'}), 200


@users_bp.route('/<int:user_id>', methods=['DELETE'])
@role_required(['ADMIN'])
def delete_user(user_id):
    # Interdire l'auto-suppression
    if request.user.get('user_id') == user_id:
        return jsonify({'error': 'Vous ne pouvez pas supprimer votre propre compte'}), 400

    user = User.get_by_id(user_id)
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    User.soft_delete(user_id)
    return jsonify({'message': 'Utilisateur désactivé'}), 200
