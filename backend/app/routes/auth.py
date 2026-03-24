"""
backend/app/routes/auth.py
Authentification avec enregistrement automatique des logs de connexion
"""
from flask import Blueprint, request, jsonify
from app.utils    import AuthHelper, token_required, role_required  # ✅ fix: AuthHelper au lieu de generate_tokens
from app.database import Database
import bcrypt

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


def log_action(user_id, action, description='', ip=None):
    """Enregistre une action dans activity_logs."""
    try:
        Database.execute_query(
            """INSERT INTO activity_logs (user_id, action, description, ip_address)
               VALUES (%s, %s, %s, %s)""",
            (user_id, action, description, ip or '')
        )
    except Exception as e:
        print(f"[LOG ERROR] {e}")


# ── Inscription ───────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    data  = request.json or {}
    name  = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    pwd   = data.get('password', '')
    plate = data.get('license_plate', '').strip().upper()

    if not name or not email or not pwd:
        return jsonify({'error': 'Nom, email et mot de passe sont obligatoires'}), 400

    import re
    if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$', pwd):
        return jsonify({'error': 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre'}), 400

    existing = Database.execute_query_one(
        "SELECT id FROM users WHERE email = %s", (email,)
    )
    if existing:
        return jsonify({'error': 'Cet email est déjà utilisé'}), 409

    hashed = bcrypt.hashpw(pwd.encode(), bcrypt.gensalt()).decode()
    user_id = Database.execute_query(
        "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, 'CLIENT')",
        (name, email, hashed)
    )

    vehicle_id = None
    if plate:
        vehicle_id = Database.execute_query(
            "INSERT INTO vehicles (user_id, license_plate, vehicle_type) VALUES (%s, %s, 'Voiture')",
            (user_id, plate)
        )

    log_action(user_id, 'Inscription', f"Nouveau compte CLIENT : {email}", request.remote_addr)

    return jsonify({
        'message':    'Compte créé avec succès',
        'user_id':    user_id,
        'vehicle_id': vehicle_id,
    }), 201


# ── Connexion ─────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    data  = request.json or {}
    email = data.get('email', '').strip().lower()
    pwd   = data.get('password', '')

    if not email or not pwd:
        return jsonify({'error': 'Email et mot de passe requis'}), 400

    user = Database.execute_query_one(
        "SELECT * FROM users WHERE email = %s AND is_active = 1", (email,)
    )
    if user is None:
        return jsonify({'error': 'Service base de donnees indisponible'}), 503

    if not user or not bcrypt.checkpw(pwd.encode(), user['password'].encode()):
        return jsonify({'error': 'Identifiants incorrects'}), 401

    vehicle = Database.execute_query_one(
        "SELECT license_plate FROM vehicles WHERE user_id = %s AND is_active = 1 LIMIT 1",
        (user['id'],)
    )
    plate = vehicle['license_plate'] if vehicle else None

    # ✅ fix: AuthHelper.create_access_token(user_id, email, role) + create_refresh_token(user_id)
    access_token  = AuthHelper.create_access_token(user['id'], user['email'], user['role'])
    refresh_token = AuthHelper.create_refresh_token(user['id'])  # persiste déjà en BD

    role_labels = {'ADMIN': 'Admin', 'MANAGER': 'Manager', 'AGENT': 'Agent', 'CLIENT': 'Client'}
    log_action(
        user['id'],
        f"Connexion {role_labels.get(user['role'], user['role'])}",
        f"{user['name']} ({user['email']}) connecté — Rôle: {user['role']}",
        request.remote_addr
    )

    return jsonify({
        'access_token':  access_token,
        'refresh_token': refresh_token,
        'user': {
            'id':    user['id'],
            'name':  user['name'],
            'email': user['email'],
            'role':  user['role'],
            'plate': plate,
        }
    }), 200


# ── Refresh token ─────────────────────────────────────────────────
@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    data          = request.json or {}
    refresh_token = data.get('refresh_token', '')

    if not refresh_token:
        return jsonify({'error': 'Refresh token manquant'}), 400

    # ✅ fix: AuthHelper.verify_refresh_token vérifie revoked + expires_at
    stored = AuthHelper.verify_refresh_token(refresh_token)
    if not stored:
        return jsonify({'error': 'Token invalide ou révoqué'}), 401

    user = Database.execute_query_one(
        "SELECT * FROM users WHERE id = %s AND is_active = 1",
        (stored['user_id'],)
    )
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 401

    AuthHelper.revoke_refresh_token(refresh_token)
    new_access  = AuthHelper.create_access_token(user['id'], user['email'], user['role'])
    new_refresh = AuthHelper.create_refresh_token(user['id'])

    return jsonify({
        'access_token':  new_access,
        'refresh_token': new_refresh,
    }), 200


# ── Déconnexion ───────────────────────────────────────────────────
@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    data          = request.json or {}
    refresh_token = data.get('refresh_token', '')
    user_id       = request.user.get('user_id')
    user_role     = request.user.get('role', '')

    if refresh_token:
        AuthHelper.revoke_refresh_token(refresh_token)  # ✅ fix: utiliser AuthHelper

    role_labels = {'ADMIN': 'Admin', 'MANAGER': 'Manager', 'AGENT': 'Agent', 'CLIENT': 'Client'}
    log_action(
        user_id,
        f"Déconnexion {role_labels.get(user_role, user_role)}",
        f"Déconnexion — Rôle: {user_role}",
        request.remote_addr
    )

    return jsonify({'message': 'Déconnecté avec succès'}), 200


# ── Profil courant ────────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@token_required
def me():
    user_id = request.user.get('user_id')
    user    = Database.execute_query_one(
        "SELECT id, name, email, role, created_at FROM users WHERE id = %s",
        (user_id,)
    )
    if not user:
        return jsonify({'error': 'Utilisateur introuvable'}), 404

    user = dict(user)
    if user.get('created_at'):
        user['created_at'] = str(user['created_at'])

    return jsonify(user), 200