"""
backend/app/routes/stats.py
Compatible BD réelle — sans payments, sans duration_minutes
+ /weekly pour le graphique des 7 derniers jours
"""
from flask import Blueprint, jsonify, request
from datetime import date
from app.utils    import token_required, role_required
from app.database import Database

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')


def _serialize(row):
    """Convertit un Row MySQL en dict JSON-sérialisable (gère les objets date)."""
    if row is None:
        return None
    d = dict(row)
    for k, v in d.items():
        if isinstance(v, date):
            d[k] = v.isoformat()   # "2025-07-14"
    return d


# ── Stats du jour ─────────────────────────────────────────────────
@stats_bp.route('/today', methods=['GET'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def today_stats():
    # Aujourd'hui
    entries = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM parking_entries WHERE DATE(entry_time) = CURDATE()"
    )
    exits = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM parking_entries "
        "WHERE DATE(exit_time) = CURDATE() AND status = 'OUT'"
    )
    active = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM parking_entries WHERE status = 'IN'"
    )
    revenue = Database.execute_query_one(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_status = 'PAID' AND DATE(paid_at) = CURDATE()"
    )
    active_subs = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM subscriptions WHERE status = 'ACTIVE'"
    )

    # Hier (pour les tendances)
    entries_yesterday = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM parking_entries WHERE DATE(entry_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)"
    )
    revenue_yesterday = Database.execute_query_one(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_status = 'PAID' AND DATE(paid_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)"
    )

    def calc_trend(current, previous):
        if previous == 0:
            return "+100%" if current > 0 else "0%"
        diff = ((current - previous) / previous) * 100
        return f"{'+' if diff >= 0 else ''}{int(diff)}%"

    return jsonify({
        'total_entries': entries['cnt'] if entries else 0,
        'entries_today': entries['cnt'] if entries else 0,
        'total_exits':   exits['cnt']   if exits   else 0,
        'active_now':    active['cnt']  if active  else 0,
        'total_revenue': float(revenue['total']) if revenue else 0,
        'active_subscriptions': active_subs['cnt'] if active_subs else 0,
        'trends': {
            'entries': calc_trend(entries['cnt'] or 0, entries_yesterday['cnt'] or 0),
            'revenue': calc_trend(float(revenue['total'] or 0), float(revenue_yesterday['total'] or 0)),
            'occupancy': calc_trend(active['cnt'] or 0, 80) # Exemple base 80
        }
    }), 200


# ── Entrées des 7 derniers jours (graphique) ──────────────────────
@stats_bp.route('/weekly', methods=['GET'])
@token_required
def weekly_stats():
    """
    Retourne la liste des 7 derniers jours avec le nombre d'entrées par jour.
    Les jours sans entrée sont inclus avec entries = 0 grâce au remplissage
    côté frontend, mais on renvoie ici uniquement les jours qui ont des données.
    """
    try:
        rows = Database.execute_query(
            """
            SELECT
                DATE(entry_time) AS date,
                COUNT(*)         AS entries
            FROM parking_entries
            WHERE entry_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(entry_time)
            ORDER BY date ASC
            """,
            fetch=True          # ← certaines implémentations utilisent ce flag
        )
    except TypeError:
        # Si execute_query ne supporte pas le paramètre fetch=, appel sans lui
        rows = Database.execute_query(
            """
            SELECT
                DATE(entry_time) AS date,
                COUNT(*)         AS entries
            FROM parking_entries
            WHERE entry_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(entry_time)
            ORDER BY date ASC
            """
        )

    result = []
    for row in (rows or []):
        r = _serialize(row)   # convertit date → "YYYY-MM-DD" correctement
        if r:
            result.append(r)

    return jsonify(result), 200


# ── Distribution par type de véhicule ─────────────────────────────
@stats_bp.route('/distribution', methods=['GET'])
@token_required
def vehicle_distribution():
    rows = Database.execute_query(
        "SELECT vehicle_type, COUNT(*) as count FROM parking_entries WHERE status = 'IN' GROUP BY vehicle_type",
        fetch=True
    )
    return jsonify(rows or []), 200


# ── Historique d'occupation (24h) ───────────────────────────────
@stats_bp.route('/occupancy-history', methods=['GET'])
@token_required
def occupancy_history():
    rows = Database.execute_query(
        """
        SELECT 
            HOUR(entry_time) as hour, 
            COUNT(*) as count 
        FROM parking_entries 
        WHERE entry_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY HOUR(entry_time)
        ORDER BY hour ASC
        """,
        fetch=True
    )
    return jsonify(rows or []), 200


# ── Vue d'ensemble ────────────────────────────────────────────────
@stats_bp.route('/overview', methods=['GET'])
@token_required
def overview():
    total_users = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM users WHERE is_active = 1"
    )
    total_vehicles = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM vehicles WHERE is_active = 1"
    )
    active_subs = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM subscriptions WHERE status = 'ACTIVE'"
    )
    open_recs = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM reclamations WHERE status IN ('OPEN', 'IN_PROGRESS')"
    )
    active_now = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM parking_entries WHERE status = 'IN'"
    )
    return jsonify({
        'total_users':          total_users['cnt']    if total_users    else 0,
        'total_vehicles':       total_vehicles['cnt'] if total_vehicles else 0,
        'active_subscriptions': active_subs['cnt']    if active_subs    else 0,
        'open_reclamations':    open_recs['cnt']      if open_recs      else 0,
        'active_now':           active_now['cnt']     if active_now     else 0,
    }), 200

# ── Historique des Revenus (Données réelles depuis payments) ──────
@stats_bp.route('/revenue-history', methods=['GET'])
@token_required
def revenue_history():
    from datetime import date, timedelta
    days = int(request.args.get('days', 7))

    rows = Database.execute_query(
        """SELECT day as date, SUM(val) as revenue
           FROM (
               -- 1. Paiements effectifs (Source principale)
               SELECT DATE(paid_at) as day, amount as val FROM payments WHERE payment_status = 'PAID'
               
               UNION ALL
               
               -- 2. Réservations validées sans paiement enregistré (Cas exceptionnels/Manuels)
               SELECT DATE(created_at) as day, montant as val FROM reservations 
               WHERE statut = 'VALIDATED' AND id NOT IN (SELECT reservation_id FROM payments WHERE reservation_id IS NOT NULL)

               UNION ALL

               -- 3. Entrées parking terminées sans paiement enregistré (Cas exceptionnels/Manuels)
               SELECT DATE(exit_time) as day, price as val FROM parking_entries
               WHERE status = 'OUT' AND price > 0 AND id NOT IN (SELECT parking_entry_id FROM payments WHERE parking_entry_id IS NOT NULL)
           ) AS combined
           WHERE day >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
           GROUP BY day
           ORDER BY day ASC""",
        (days,), fetch=True
    )

    # Construire un dict avec les jours qui ont des données
    revenue_map = {}
    for row in (rows or []):
        d = row['date']
        revenue_map[d.isoformat() if hasattr(d, 'isoformat') else str(d)] = float(row['revenue'])

    # Remplir les jours sans données avec 0
    result = []
    for i in range(days):
        day_str = (date.today() - timedelta(days=days - 1 - i)).isoformat()
        result.append({"date": day_str, "revenue": revenue_map.get(day_str, 0)})

    return jsonify(result), 200