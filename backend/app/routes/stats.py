"""
app/routes/stats.py
Statistiques : jour, mois, vue d'ensemble, revenus, export CSV.
"""
import csv
import io
from flask import Blueprint, request, jsonify, Response

from app.utils    import token_required, role_required
from app.services import ParkingService
from app.database import Database

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')


@stats_bp.route('/today', methods=['GET'])
@role_required(['ADMIN', 'MANAGER', 'AGENT'])
def today_stats():
    entries = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM parking_entries WHERE DATE(entry_time) = CURDATE()"
    )
    exits = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt, COALESCE(SUM(price), 0) AS revenue "
        "FROM parking_entries WHERE DATE(exit_time) = CURDATE() AND status = 'OUT'"
    )
    active = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM parking_entries WHERE status = 'IN'"
    )
    return jsonify({
        'entries_today':  entries['cnt'] if entries else 0,
        'exits_today':    exits['cnt']   if exits   else 0,
        'revenue_today':  float(exits['revenue']) if exits else 0.0,
        'active_now':     active['cnt']  if active  else 0,
        'capacity':       ParkingService.get_capacity_summary(),
    }), 200


@stats_bp.route('/monthly', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def monthly_stats():
    year  = request.args.get('year',  None)
    month = request.args.get('month', None)

    if year and month:
        rows = Database.execute_query(
            """SELECT DAY(entry_time) AS day,
                      COUNT(*) AS entries,
                      COALESCE(SUM(price), 0) AS revenue
               FROM parking_entries
               WHERE YEAR(entry_time) = %s AND MONTH(entry_time) = %s AND status = 'OUT'
               GROUP BY DAY(entry_time)
               ORDER BY day""",
            (year, month), fetch=True
        )
    else:
        rows = Database.execute_query(
            """SELECT DAY(entry_time) AS day,
                      COUNT(*) AS entries,
                      COALESCE(SUM(price), 0) AS revenue
               FROM parking_entries
               WHERE MONTH(entry_time) = MONTH(NOW())
                 AND YEAR(entry_time)  = YEAR(NOW())
                 AND status = 'OUT'
               GROUP BY DAY(entry_time)
               ORDER BY day""",
            fetch=True
        )
    return jsonify(rows or []), 200


@stats_bp.route('/overview', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def overview():
    total_users = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM users WHERE is_active = TRUE"
    )
    total_vehicles = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM vehicles WHERE is_active = TRUE"
    )
    active_subs = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM subscriptions WHERE status = 'ACTIVE'"
    )
    open_recs = Database.execute_query_one(
        "SELECT COUNT(*) AS cnt FROM reclamations WHERE status IN ('OPEN', 'IN_PROGRESS')"
    )
    total_revenue = Database.execute_query_one(
        "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_status = 'PAID'"
    )
    revenue_month = Database.execute_query_one(
        """SELECT COALESCE(SUM(amount), 0) AS total FROM payments
           WHERE payment_status = 'PAID'
             AND MONTH(paid_at) = MONTH(NOW())
             AND YEAR(paid_at)  = YEAR(NOW())"""
    )

    return jsonify({
        'total_users':        total_users['cnt']          if total_users    else 0,
        'total_vehicles':     total_vehicles['cnt']       if total_vehicles else 0,
        'active_subscriptions': active_subs['cnt']        if active_subs    else 0,
        'open_reclamations':  open_recs['cnt']            if open_recs      else 0,
        'total_revenue':      float(total_revenue['total'])  if total_revenue  else 0.0,
        'revenue_this_month': float(revenue_month['total'])  if revenue_month  else 0.0,
        'capacity':           ParkingService.get_capacity_summary(),
    }), 200


@stats_bp.route('/export/csv', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def export_csv():
    """Export des entrées/sorties du mois en CSV."""
    rows = Database.execute_query(
        """SELECT license_plate, vehicle_type, spot_number,
                  entry_time, exit_time, duration_minutes, price, status
           FROM parking_entries
           WHERE MONTH(entry_time) = MONTH(NOW())
             AND YEAR(entry_time)  = YEAR(NOW())
           ORDER BY entry_time DESC""",
        fetch=True
    )

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        'license_plate', 'vehicle_type', 'spot_number',
        'entry_time', 'exit_time', 'duration_minutes', 'price', 'status'
    ])
    writer.writeheader()
    for row in (rows or []):
        writer.writerow({k: row.get(k, '') for k in writer.fieldnames})

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=parking_report.csv'}
    )
