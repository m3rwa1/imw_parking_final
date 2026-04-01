from flask import Blueprint, request, jsonify, current_app
from app.database import Database
from app.utils.auth import token_required, role_required
import datetime

reservations_bp = Blueprint('reservations', __name__, url_prefix='/api/reservations')

@reservations_bp.route('/', methods=['POST'])
@token_required
def create_reservation():
    """Client creates a reservation for a relative"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    # Expected payload (new): { proche_id, place_number, license_plate, vehicle_type, start_time, end_time, montant }
    required_fields = ['proche_id', 'place_number', 'license_plate', 'vehicle_type', 'start_time', 'end_time', 'montant']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields (proche_id, place_number, license_plate, vehicle_type, start_time, end_time, montant)'}), 400

    requester_id = request.user.get('user_id')

    # Legacy flow: keep original behaviour when no `proche_id` provided
    if 'proche_id' not in data:
        # validate legacy required fields
        required_fields_old = ['nom_proche', 'license_plate', 'vehicle_type', 'start_time', 'end_time', 'montant']
        if not all(field in data for field in required_fields_old):
            return jsonify({'error': 'Missing required fields for reservation'}), 400

        # Insert reservation for the requester (self)
        with Database.get_db() as conn:
            cursor = conn.cursor(dictionary=True)
            
            # Check overlap if spot specifically chosen (legacy might not have spot, but just in case)
            if data.get('place_number'):
                cursor.execute("""
                    SELECT COUNT(*) AS conflict_count FROM reservations 
                    WHERE place_number = %s AND statut IN ('PENDING', 'VALIDATED') 
                    AND start_time < %s AND end_time > %s
                """, (data['place_number'], data['end_time'], data['start_time']))
                conflict = cursor.fetchone()
                if conflict and conflict['conflict_count'] > 0:
                    return jsonify({'error': f"La place est déjà réservée sur ce créneau"}), 409

            res_query = """
            INSERT INTO reservations (user_id, nom_proche, license_plate, vehicle_type, start_time, end_time, montant, statut, place_number)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'PENDING', %s)
            """
            res_params = (
                requester_id,
                data['nom_proche'] or '',
                data['license_plate'].upper(),
                data['vehicle_type'],
                data['start_time'],
                data['end_time'],
                data['montant'],
                data.get('place_number') or None
            )
            cursor.execute(res_query, res_params)
            reservation_id = cursor.lastrowid

            # Insert payment (legacy behaviour)
            payment_query = """
            INSERT INTO payments (reservation_id, amount, payment_method, payment_status, paid_at)
            VALUES (%s, %s, %s, 'PAID', %s)
            """
            payment_params = (
                reservation_id,
                data['montant'],
                data.get('payment_method', 'ONLINE'),
                datetime.datetime.now()
            )
            cursor.execute(payment_query, payment_params)
            conn.commit()

        return jsonify({
            'message': 'Reservation created successfully (legacy flow)',
            'reservation_id': reservation_id
        }), 201

    # New flow
    # Expected payload (new): { proche_id, place_number, license_plate, vehicle_type, start_time, end_time, montant }
    required_fields = ['proche_id', 'place_number', 'license_plate', 'vehicle_type', 'start_time', 'end_time', 'montant']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields (proche_id, place_number, license_plate, vehicle_type, start_time, end_time, montant)'}), 400

    requester_id = request.user.get('user_id')
    user_record = Database.execute_query_one("SELECT name FROM users WHERE id = %s", (requester_id,))
    is_for_self = data.get('nom_proche') == user_record['name'] if user_record else False

    # 1) Verify requester is a "client fidèle" only if it's for a proche
    if not is_for_self:
        loyal = Database.execute_query_one("SELECT id FROM subscriptions WHERE user_id = %s AND status = 'ACTIVE' AND end_date >= CURDATE()", (requester_id,))
        if not loyal:
            return jsonify({'error': 'Seuls les clients fidèles peuvent réserver pour des proches'}), 403

    proche_id = data.get('proche_id', 0)

    # 2) Verify proche relation exists (user_relations table). If the table doesn't exist, deny to avoid unsafe assumptions.
    # Special case: proche_id == 0 means client provided nom_proche only (unregistered proche). Allow loyal clients to create such reservations.
    if proche_id == 0:
        # treat as unregistered proche; assign reservation.user_id to requester (so reservation is linked to the requester)
        rel_check = True
        proche_id = requester_id
    else:
        rel_check = Database.execute_query_one(
            "SELECT id FROM user_relations WHERE user_id = %s AND proche_user_id = %s",
            (requester_id, proche_id)
        )
        if not rel_check:
            return jsonify({'error': 'The specified user is not registered as a proche of the loyal client'}), 403

    with Database.get_db() as conn:
        cursor = conn.cursor(dictionary=True)

        # 3) Ensure vehicle exists (assign to proche). If not exists, create it.
        cursor.execute("SELECT id FROM vehicles WHERE license_plate = %s", (data['license_plate'].upper(),))
        v = cursor.fetchone()
        if v:
            vehicle_id = v['id']
        else:
            cursor.execute(
                "INSERT INTO vehicles (license_plate, vehicle_type, user_id) VALUES (%s, %s, %s)",
                (data['license_plate'].upper(), data['vehicle_type'], proche_id)
            )
            vehicle_id = cursor.lastrowid

        # 3.5) Check overlap
        cursor.execute("""
            SELECT COUNT(*) AS conflict_count FROM reservations 
            WHERE place_number = %s AND statut IN ('PENDING', 'VALIDATED') 
            AND start_time < %s AND end_time > %s
        """, (data['place_number'], data['end_time'], data['start_time']))
        conflict = cursor.fetchone()
        if conflict and conflict['conflict_count'] > 0:
            return jsonify({'error': f"La place {data['place_number']} est déjà réservée sur ce créneau"}), 409

        # 4) Insert reservation for the proche (the end-user of the reservation)
        res_query = (
            "INSERT INTO reservations (user_id, nom_proche, license_plate, vehicle_type, start_time, end_time, montant, statut, place_number, created_by) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, 'PENDING', %s, %s)"
        )
        res_params = (
            proche_id,
            data.get('nom_proche') or '',
            data['license_plate'].upper(),
            data['vehicle_type'],
            data['start_time'],
            data['end_time'],
            data['montant'],
            data['place_number'],
            requester_id
        )
        cursor.execute(res_query, res_params)
        reservation_id = cursor.lastrowid

        # 5) Create payment if provided/needed
        cursor.execute(
            "INSERT INTO payments (reservation_id, amount, payment_method, payment_status, paid_at) VALUES (%s, %s, %s, 'PAID', %s)",
            (reservation_id, data['montant'], data.get('payment_method', 'ONLINE'), datetime.datetime.now())
        )

        conn.commit()

    return jsonify({
        'message': 'Reservation created successfully',
        'reservation_id': reservation_id
    }), 201


@reservations_bp.route('/', methods=['GET'])
@token_required
def get_user_reservations():
    """Client gets their own reservations"""
    query = """
    SELECT r.*, p.payment_status, p.amount as payment_amount
    FROM reservations r
    LEFT JOIN payments p ON p.reservation_id = r.id
    WHERE r.user_id = %s
    ORDER BY r.created_at DESC
    """
    results = Database.execute_query(query, (request.user.get('user_id'),), fetch=True)
    return jsonify(results), 200


@reservations_bp.route('/admin', methods=['GET'])
@role_required(['ADMIN','MANAGER'])
def get_all_reservations():
    """Admin gets reservations for proches of loyal clients with pagination"""
    page     = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 5))
    offset   = (page - 1) * per_page

    query = """
    SELECT r.id, r.place_number AS place_number, r.license_plate AS plate_number, COALESCE(NULLIF(r.vehicle_type, ''), 'Voiture') AS vehicle, 
           COALESCE(NULLIF(r.nom_proche, ''), u.name) AS owner_name, r.statut AS status, u.email as owner_email, p.amount as payment_amount, r.created_at, r.start_time, r.end_time
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    LEFT JOIN payments p ON p.reservation_id = r.id
    ORDER BY r.created_at DESC
    LIMIT %s OFFSET %s
    """
    rows = Database.execute_query(query, (per_page, offset), fetch=True)

    total_query = """
    SELECT COUNT(*) as cnt
    FROM reservations r
    JOIN users u ON r.user_id = u.id
    """
    total = Database.execute_query_one(total_query)

    data = []
    for r in (rows or []):
        item = {
            'id': r.get('id'),
            'place_number': r.get('place_number'),
            'vehicle': r.get('vehicle'),
            'plate_number': r.get('plate_number'),
            'owner_name': r.get('owner_name'),
            'owner_email': r.get('owner_email'),
            'category': 'EXTRA',
            'status': r.get('status'),
            'start_time': str(r.get('start_time')).replace(' ', 'T') if r.get('start_time') else None,
            'end_time': str(r.get('end_time')).replace(' ', 'T') if r.get('end_time') else None
        }
        data.append(item)

    return jsonify({
        'data': data,
        'total': total['cnt'] if total else 0
    }), 200


# ── Supprimer une réservation [ADMIN] ────────────────────────────
@reservations_bp.route('/<int:res_id>', methods=['DELETE'])
@role_required(['ADMIN'])
def delete_reservation(res_id):
    Database.execute_query(
        "DELETE FROM reservations WHERE id = %s", (res_id,)
    )
    return jsonify({'message': 'Réservation supprimée'}), 200


@reservations_bp.route('/<int:id>/validate', methods=['PUT'])
@role_required(['ADMIN'])
def validate_reservation(id):
    """Admin validates a reservation, creates vehicle and assigns spot"""
    data = request.get_json() or {}
    spot_number = data.get('spot_number', 'AUTO')
    
    with Database.get_db() as conn:
        cursor = conn.cursor(dictionary=True)
        
        # Check reservation
        cursor.execute("SELECT * FROM reservations WHERE id = %s AND statut = 'PENDING'", (id,))
        reservation = cursor.fetchone()
        
        if not reservation:
            return jsonify({'error': 'Reservation not found or not pending'}), 404
            
        # 1. Update reservation status
        cursor.execute("UPDATE reservations SET statut = 'VALIDATED' WHERE id = %s", (id,))
        
        # 2. Check if vehicle exists, otherwise create
        cursor.execute("SELECT id FROM vehicles WHERE license_plate = %s", (reservation['license_plate'],))
        vehicle = cursor.fetchone()
        
        if vehicle:
            vehicle_id = vehicle['id']
        else:
            cursor.execute(
                "INSERT INTO vehicles (license_plate, vehicle_type, user_id) VALUES (%s, %s, %s)",
                (reservation['license_plate'], reservation['vehicle_type'], reservation['user_id'])
            )
            vehicle_id = cursor.lastrowid
            
        # 3. Create payment log if needed (Already handled during creation usually)
        
        conn.commit()
        
    return jsonify({'message': 'Reservation validated and vehicle added successfully'}), 200
# ── Vider toutes les réservations [ADMIN] ──────────────────────────
@reservations_bp.route('/clear-all', methods=['DELETE'])
@role_required(['ADMIN'])
def clear_all():
    Database.execute_query("DELETE FROM reservations")
    return jsonify({'message': 'Toutes les réservations ont été supprimées'}), 200
