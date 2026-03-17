"""
backend/app/routes/pricing.py
Compatible avec la nouvelle structure pricing_plans :
id, name, label, price, unit, is_active, created_at, updated_at
"""
from flask import Blueprint, request, jsonify
from app.utils    import token_required, role_required
from app.database import Database

pricing_bp = Blueprint('pricing', __name__, url_prefix='/api/pricing')


# ── Lire tous les tarifs actifs (public — pas de token requis) ────
@pricing_bp.route('/', methods=['GET'])
def get_all():
    rows = Database.execute_query(
        "SELECT * FROM pricing_plans WHERE is_active = 1 ORDER BY id ASC",
        fetch=True
    )
    result = []
    for row in (rows or []):
        r = dict(row)
        if r.get('created_at'): r['created_at'] = str(r['created_at'])
        if r.get('updated_at'): r['updated_at'] = str(r['updated_at'])
        # Convertir price en float pour le frontend
        if r.get('price') is not None:
            r['price'] = float(r['price'])
        result.append(r)
    return jsonify(result), 200


# ── Modifier un tarif [ADMIN] ─────────────────────────────────────
@pricing_bp.route('/<int:plan_id>', methods=['PUT'])
@role_required(['ADMIN'])
def update_plan(plan_id):
    data = request.json or {}

    # Vérifier que le plan existe
    existing = Database.execute_query_one(
        "SELECT id FROM pricing_plans WHERE id = %s", (plan_id,)
    )
    if not existing:
        return jsonify({'error': 'Tarif introuvable'}), 404

    # Champs modifiables
    allowed = ['label', 'price', 'unit']
    updates, params = [], []

    for key in allowed:
        if key in data:
            updates.append(f"{key} = %s")
            params.append(data[key])

    if not updates:
        return jsonify({'error': 'Aucun champ à modifier'}), 400

    params.append(plan_id)
    Database.execute_query(
        f"UPDATE pricing_plans SET {', '.join(updates)}, updated_at = NOW() WHERE id = %s",
        params
    )

    # Retourner le tarif mis à jour
    updated = Database.execute_query_one(
        "SELECT * FROM pricing_plans WHERE id = %s", (plan_id,)
    )
    r = dict(updated)
    if r.get('created_at'): r['created_at'] = str(r['created_at'])
    if r.get('updated_at'): r['updated_at'] = str(r['updated_at'])
    if r.get('price') is not None: r['price'] = float(r['price'])

    return jsonify({'message': 'Tarif mis à jour', 'plan': r}), 200