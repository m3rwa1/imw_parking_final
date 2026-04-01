"""
app/routes/payments.py
Gestion des paiements.
"""
from flask import Blueprint, request, jsonify
from marshmallow import ValidationError

from app.utils    import token_required, role_required, CreatePaymentSchema
from app.database import Database

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

_create_schema = CreatePaymentSchema()


@payments_bp.route('/', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def get_all_payments():
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    offset   = (page - 1) * per_page

    rows = Database.execute_query(
        "SELECT * FROM payments ORDER BY created_at DESC LIMIT %s OFFSET %s",
        (per_page, offset), fetch=True
    )
    total = Database.execute_query_one("SELECT COUNT(*) AS cnt FROM payments")

    return jsonify({
        'data':     rows or [],
        'page':     page,
        'per_page': per_page,
        'total':    total['cnt'] if total else 0,
    }), 200


@payments_bp.route('/<int:payment_id>', methods=['GET'])
@token_required
def get_payment(payment_id):
    row = Database.execute_query_one(
        "SELECT * FROM payments WHERE id = %s", (payment_id,)
    )
    if not row:
        return jsonify({'error': 'Paiement introuvable'}), 404
    return jsonify(row), 200


@payments_bp.route('/create', methods=['POST'])
@role_required(['ADMIN', 'MANAGER', 'AGENT', 'CLIENT'])
def create_payment():
    try:
        data = _create_schema.load(request.get_json() or {})
    except ValidationError as e:
        return jsonify({'error': 'Validation échouée', 'details': e.messages}), 400

    paid_at = "NOW()" if data.get('payment_status', 'PAID') == 'PAID' else None
    payment_id = Database.execute_query(
        """INSERT INTO payments
           (parking_entry_id, subscription_id, amount, payment_method, payment_status, reference, paid_at)
           VALUES (%s, %s, %s, %s, 'PAID', %s, NOW())""",
        (data.get('parking_entry_id'), data.get('subscription_id'),
         float(data['amount']), data['payment_method'], data.get('reference'))
    )
    return jsonify({'message': 'Paiement enregistré', 'payment_id': payment_id}), 201


@payments_bp.route('/summary', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def payment_summary():
    """Résumé financier : total par méthode et par statut."""
    rows = Database.execute_query(
        """SELECT payment_method, payment_status,
                  COUNT(*) AS count, SUM(amount) AS total
           FROM payments
           GROUP BY payment_method, payment_status
           ORDER BY payment_method""",
        fetch=True
    )
    return jsonify(rows or []), 200
