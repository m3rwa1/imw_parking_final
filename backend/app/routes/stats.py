from flask import Blueprint, jsonify
from app.models import ParkingStats, Vehicle
from app.utils import role_required

stats_bp = Blueprint('stats', __name__, url_prefix='/api/stats')

@stats_bp.route('/today', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def get_daily_stats():
    """Get today's parking statistics"""
    daily = ParkingStats.get_daily_stats()
    daily = daily or {
        'total_vehicles': 0,
        'current_occupancy': 0,
        'daily_revenue': 0
    }
    return jsonify(daily), 200

@stats_bp.route('/monthly', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def get_monthly_stats():
    """Get this month's statistics"""
    monthly = ParkingStats.get_monthly_stats()
    monthly = monthly or {
        'monthly_revenue': 0,
        'total_vehicles_month': 0
    }
    return jsonify(monthly), 200

@stats_bp.route('/overview', methods=['GET'])
@role_required(['ADMIN', 'MANAGER'])
def get_overview():
    """Get complete overview"""
    daily = ParkingStats.get_daily_stats()
    monthly = ParkingStats.get_monthly_stats()
    active = Vehicle.get_active_vehicles()
    
    daily = daily or {
        'total_vehicles': 0,
        'current_occupancy': 0,
        'daily_revenue': 0
    }
    monthly = monthly or {
        'monthly_revenue': 0,
        'total_vehicles_month': 0
    }
    
    return jsonify({
        'daily': daily,
        'monthly': monthly,
        'active_count': len(active) if active else 0
    }), 200
