"""
app/utils/auth.py
JWT (access + refresh tokens), bcrypt, décorateurs RBAC.
"""
import jwt
import bcrypt
import secrets
from datetime import datetime, timedelta
from functools import wraps

from flask import request, jsonify, current_app
from app.database import Database


class AuthHelper:
    """Helpers d'authentification"""

    # ── Passwords ────────────────────────────────────────────────

    @staticmethod
    def hash_password(password: str) -> str:
        salt   = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        try:
            return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
        except Exception:
            return False

    # ── Access Token ─────────────────────────────────────────────

    @staticmethod
    def create_access_token(user_id: int, email: str, role: str,
                            expires_in: int = 3600) -> str:
        """Génère un JWT access token (1h par défaut)."""
        payload = {
            'user_id':   user_id,
            'email':     email,
            'role':      role,
            'type':      'access',
            'exp':       datetime.utcnow() + timedelta(seconds=expires_in),
            'iat':       datetime.utcnow(),
        }
        return jwt.encode(
            payload,
            current_app.config['JWT_SECRET_KEY'],
            algorithm=current_app.config.get('JWT_ALGORITHM', 'HS256')
        )

    @staticmethod
    def create_token(user_id: int, email: str, role: str,
                     expires_in: int = 86400) -> str:
        """Alias rétrocompatible → access token."""
        return AuthHelper.create_access_token(user_id, email, role, expires_in)

    @staticmethod
    def verify_token(token: str) -> dict | None:
        try:
            return jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=[current_app.config.get('JWT_ALGORITHM', 'HS256')]
            )
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None

    # ── Refresh Token ────────────────────────────────────────────

    @staticmethod
    def create_refresh_token(user_id: int) -> str:
        """Génère un refresh token opaque (30 jours) et le persiste en BD."""
        token      = secrets.token_urlsafe(64)
        expires_at = datetime.utcnow() + timedelta(days=30)

        Database.execute_query(
            "INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user_id, token, expires_at)
        )
        return token

    @staticmethod
    def verify_refresh_token(token: str) -> dict | None:
        """Vérifie un refresh token; retourne la ligne DB ou None."""
        row = Database.execute_query_one(
            """SELECT * FROM refresh_tokens
               WHERE token = %s AND revoked = FALSE AND expires_at > NOW()""",
            (token,)
        )
        return row

    @staticmethod
    def revoke_refresh_token(token: str):
        """Révoque un refresh token (logout)."""
        Database.execute_query(
            "UPDATE refresh_tokens SET revoked = TRUE WHERE token = %s",
            (token,)
        )

    @staticmethod
    def revoke_all_user_tokens(user_id: int):
        """Révoque tous les refresh tokens d'un utilisateur."""
        Database.execute_query(
            "UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = %s",
            (user_id,)
        )


# ── Décorateurs ──────────────────────────────────────────────────

def token_required(f):
    """Vérifie la présence et la validité du JWT access token."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ', 1)[1]

        if not token:
            return jsonify({'error': 'Token manquant'}), 401

        payload = AuthHelper.verify_token(token)
        if not payload:
            return jsonify({'error': 'Token invalide ou expiré'}), 401

        request.user = payload
        return f(*args, **kwargs)

    return decorated


def role_required(roles: list):
    """Vérifie que le rôle de l'utilisateur est dans la liste autorisée."""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            if request.user.get('role') not in roles:
                return jsonify({'error': 'Permissions insuffisantes'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
