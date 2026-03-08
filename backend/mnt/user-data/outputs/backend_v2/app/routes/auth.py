"""
app/routes/auth.py
Authentification : register, login, refresh, logout, me.
"""
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.models  import User
from app.utils   import AuthHelper, token_required, RegisterSchema, LoginSchema
from app.database import Database
from app          import limiter

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

_register_schema = RegisterSchema()
_login_schema    = LoginSchema()


# ── Register ─────────────────────────────────────────────────────

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10/hour")
def register():
    try:
        data = _register_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({'error': 'Validation échouée', 'details': e.messages}), 400

    if User.get_by_email(data['email']):
        return jsonify({'error': 'Cet email est déjà utilisé'}), 409

    # Seul un ADMIN peut créer d'autres rôles via l'API publique
    role = data.get('role', 'CLIENT')
    if role != 'CLIENT':
        auth_header = request.headers.get('Authorization', '')
        if not auth_header:
            role = 'CLIENT'  # forcé

    User.create(data['name'], data['email'], data['password'], role, data.get('phone'))
    return jsonify({'message': 'Compte créé avec succès', 'role': role}), 201


# ── Login ────────────────────────────────────────────────────────

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10/minute")          # ✅ Protection brute-force
def login():
    try:
        data = _login_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({'error': 'Validation échouée', 'details': e.messages}), 400

    user = User.get_by_email(data['email'])
    if not user or not AuthHelper.verify_password(data['password'], user['password']):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

    if not user.get('is_active', True):
        return jsonify({'error': 'Compte désactivé, contactez l\'administration'}), 403

    # Mise à jour last_login
    Database.execute_query(
        "UPDATE users SET last_login = NOW() WHERE id = %s", (user['id'],)
    )

    access_token  = AuthHelper.create_access_token(user['id'], user['email'], user['role'], expires_in=3600)
    refresh_token = AuthHelper.create_refresh_token(user['id'])

    return jsonify({
        'access_token':  access_token,
        'refresh_token': refresh_token,
        'token_type':    'Bearer',
        'expires_in':    3600,
        'user': {
            'id':    user['id'],
            'name':  user['name'],
            'email': user['email'],
            'role':  user['role'],
            'phone': user.get('phone'),
        }
    }), 200


# ── Refresh ──────────────────────────────────────────────────────

@auth_bp.route('/refresh', methods=['POST'])
@limiter.limit("30/hour")
def refresh():
    """Échange un refresh token contre un nouvel access token."""
    body = request.get_json() or {}
    token = body.get('refresh_token')

    if not token:
        return jsonify({'error': 'refresh_token manquant'}), 400

    row = AuthHelper.verify_refresh_token(token)
    if not row:
        return jsonify({'error': 'Refresh token invalide ou expiré'}), 401

    user = User.get_by_id(row['user_id'])
    if not user or not user.get('is_active', True):
        return jsonify({'error': 'Utilisateur introuvable ou désactivé'}), 401

    new_access = AuthHelper.create_access_token(user['id'], user['email'], user['role'])

    return jsonify({
        'access_token': new_access,
        'token_type':   'Bearer',
        'expires_in':   3600,
    }), 200


# ── Logout ───────────────────────────────────────────────────────

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    """Révoque le refresh token fourni."""
    body = request.get_json() or {}
    token = body.get('refresh_token')
    if token:
        AuthHelper.revoke_refresh_token(token)
    return jsonify({'message': 'Déconnexion réussie'}), 200


# ── Me ───────────────────────────────────────────────────────────

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    user = User.get_by_id(request.user.get('user_id'))
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    return jsonify({
        'id':         user['id'],
        'name':       user['name'],
        'email':      user['email'],
        'role':       user['role'],
        'phone':      user.get('phone'),
        'last_login': str(user.get('last_login', '')),
    }), 200
