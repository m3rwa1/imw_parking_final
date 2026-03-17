"""
backend/app/routes/stats.py
Compatible BD réelle — sans payments, sans duration_minutes
+ /weekly pour le graphique des 7 derniers jours
"""
from flask import Blueprint, jsonify
from app.utils    import token_required, role_required
from app.database import Database

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')


# ── Stats du jour ─────────────────────────────────────────────────
@stats_bp.route('/today', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def today_stats():
    entries = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM parking_entries WHERE DATE(entry_time) = CURDATE()"
    )
    exits = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM parking_entries WHERE DATE(exit_time) = CURDATE() AND status = 'OUT'"
    )
    active = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM parking_entries WHERE status = 'IN'"
    )
    return jsonify({
        'total_entries': entries['cnt'] if entries else 0,
        'entries_today': entries['cnt'] if entries else 0,
        'total_exits':   exits['cnt']   if exits   else 0,
        'active_now':    active['cnt']  if active  else 0,
        'total_revenue': 0,
    }), 200


# ── Entrées des 7 derniers jours (graphique) ──────────────────────
@stats_bp.route('/weekly', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def weekly_stats():
    rows = Database.execute_query(
        """SELECT
               DATE(entry_time)  AS date,
               COUNT(*)          AS entries
           FROM parking_entries
           WHERE entry_time >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
           GROUP BY DATE(entry_time)
           ORDER BY date ASC""",
        fetch=True
    )
    result = []
    for row in (rows or []):
        r = dict(row)
        if r.get('date'):
            r['date'] = str(r['date'])
        result.append(r)
    return jsonify(result), 200


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