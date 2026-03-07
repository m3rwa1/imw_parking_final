from app.database import Database

class User:
    """User model"""
    
    @staticmethod
    def create(name, email, password, role):
        """Create a new user"""
        from app.utils.auth import AuthHelper
        
        hashed_pwd = AuthHelper.hash_password(password)
        query = """
            INSERT INTO users (name, email, password, role)
            VALUES (%s, %s, %s, %s)
        """
        result = Database.execute_query(query, (name, email, hashed_pwd, role))
        return result
    
    @staticmethod
    def get_by_email(email):
        """Get user by email"""
        query = "SELECT * FROM users WHERE email = %s"
        return Database.execute_query_one(query, (email,))
    
    @staticmethod
    def get_by_id(user_id):
        """Get user by ID"""
        query = "SELECT * FROM users WHERE id = %s"
        return Database.execute_query_one(query, (user_id,))
    
    @staticmethod
    def get_all():
        """Get all users"""
        query = "SELECT id, name, email, role, created_at FROM users"
        return Database.execute_query(query, fetch=True)
    
    @staticmethod
    def update(user_id, **kwargs):
        """Update user"""
        allowed_fields = ['name', 'email', 'role']
        updates = []
        params = []
        
        for key, value in kwargs.items():
            if key in allowed_fields:
                updates.append(f"{key} = %s")
                params.append(value)
        
        if not updates:
            return False
        
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        Database.execute_query(query, params)
        return True
    
    @staticmethod
    def delete(user_id):
        """Delete user"""
        query = "DELETE FROM users WHERE id = %s"
        Database.execute_query(query, (user_id,))
        return True


class Vehicle:
    """Vehicle model"""
    
    @staticmethod
    def create(license_plate, vehicle_type, user_id=None):
        """Create a new vehicle"""
        query = """
            INSERT INTO vehicles (license_plate, vehicle_type, user_id)
            VALUES (%s, %s, %s)
        """
        result = Database.execute_query(query, (license_plate, vehicle_type, user_id))
        return result
    
    @staticmethod
    def get_all():
        """Get all vehicles"""
        query = "SELECT * FROM vehicles ORDER BY created_at DESC"
        return Database.execute_query(query, fetch=True)
    
    @staticmethod
    def get_by_id(vehicle_id):
        """Get vehicle by ID"""
        query = "SELECT * FROM vehicles WHERE id = %s"
        return Database.execute_query_one(query, (vehicle_id,))
    
    @staticmethod
    def get_by_plate(license_plate):
        """Get vehicle by license plate"""
        query = "SELECT * FROM vehicles WHERE license_plate = %s"
        return Database.execute_query_one(query, (license_plate,))
    
    @staticmethod
    def entry(license_plate, spot_number, vehicle_type=None):
        """Register vehicle entry"""
        query = """
            INSERT INTO parking_entries (license_plate, entry_time, spot_number, status)
            VALUES (%s, NOW(), %s, 'IN')
        """
        result = Database.execute_query(query, (license_plate, spot_number))
        return result
    
    @staticmethod
    def exit(license_plate, price=None):
        """Register vehicle exit"""
        query = """
            UPDATE parking_entries 
            SET exit_time = NOW(), status = 'OUT', price = %s
            WHERE license_plate = %s AND status = 'IN'
            ORDER BY entry_time DESC
            LIMIT 1
        """
        result = Database.execute_query(query, (price, license_plate))
        return result
    
    @staticmethod
    def get_active_vehicles():
        """Get all active vehicles in parking"""
        query = """
            SELECT * FROM parking_entries 
            WHERE status = 'IN'
            ORDER BY entry_time DESC
        """
        return Database.execute_query(query, fetch=True)
    
    @staticmethod
    def get_vehicle_history(license_plate):
        """Get vehicle history"""
        query = """
            SELECT * FROM parking_entries 
            WHERE license_plate = %s
            ORDER BY entry_time DESC
        """
        return Database.execute_query(query, (license_plate,), fetch=True)


class Subscription:
    """Subscription model"""
    
    @staticmethod
    def create(user_id, vehicle_id, license_plate, plan_type, start_date, end_date):
        """Create a new subscription"""
        query = """
            INSERT INTO subscriptions (user_id, vehicle_id, license_plate, plan_type, start_date, end_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, 'ACTIVE')
        """
        result = Database.execute_query(query, (user_id, vehicle_id, license_plate, plan_type, start_date, end_date))
        return result
    
    @staticmethod
    def get_all():
        """Get all subscriptions"""
        query = "SELECT * FROM subscriptions ORDER BY created_at DESC"
        return Database.execute_query(query, fetch=True)
    
    @staticmethod
    def get_by_id(sub_id):
        """Get subscription by ID"""
        query = "SELECT * FROM subscriptions WHERE id = %s"
        return Database.execute_query_one(query, (sub_id,))
    
    @staticmethod
    def get_by_user(user_id):
        """Get subscriptions by user"""
        query = "SELECT * FROM subscriptions WHERE user_id = %s AND status = 'ACTIVE'"
        return Database.execute_query(query, (user_id,), fetch=True)
    
    @staticmethod
    def update_status(sub_id, status):
        """Update subscription status"""
        query = "UPDATE subscriptions SET status = %s WHERE id = %s"
        Database.execute_query(query, (status, sub_id))
        return True


class Reclamation:
    """Reclamation/Complaint model"""
    
    @staticmethod
    def create(user_id, subject, description, status='OPEN'):
        """Create a new reclamation"""
        query = """
            INSERT INTO reclamations (user_id, subject, description, status)
            VALUES (%s, %s, %s, %s)
        """
        result = Database.execute_query(query, (user_id, subject, description, status))
        return result
    
    @staticmethod
    def get_all():
        """Get all reclamations"""
        query = """
            SELECT r.*, u.name, u.email 
            FROM reclamations r
            LEFT JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC
        """
        return Database.execute_query(query, fetch=True)
    
    @staticmethod
    def get_by_id(rec_id):
        """Get reclamation by ID"""
        query = """
            SELECT r.*, u.name, u.email 
            FROM reclamations r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.id = %s
        """
        return Database.execute_query_one(query, (rec_id,))
    
    @staticmethod
    def get_by_user(user_id):
        """Get reclamations by user"""
        query = "SELECT * FROM reclamations WHERE user_id = %s ORDER BY created_at DESC"
        return Database.execute_query(query, (user_id,), fetch=True)
    
    @staticmethod
    def update_status(rec_id, status):
        """Update reclamation status"""
        query = "UPDATE reclamations SET status = %s, updated_at = NOW() WHERE id = %s"
        Database.execute_query(query, (status, rec_id))
        return True

class ParkingStats:
    """Parking statistics model"""
    
    @staticmethod
    def get_daily_stats():
        """Get today's statistics"""
        query = """
            SELECT 
                COUNT(DISTINCT license_plate) as total_vehicles,
                SUM(CASE WHEN status = 'IN' THEN 1 ELSE 0 END) as current_occupancy,
                COALESCE(SUM(CASE WHEN DATE(exit_time) = CURDATE() THEN price ELSE 0 END), 0) as daily_revenue
            FROM parking_entries
            WHERE DATE(entry_time) = CURDATE()
        """
        return Database.execute_query_one(query, fetch=False)
    
    @staticmethod
    def get_monthly_stats():
        """Get this month's statistics"""
        query = """
            SELECT 
                COALESCE(SUM(price), 0) as monthly_revenue,
                COUNT(DISTINCT license_plate) as total_vehicles_month
            FROM parking_entries
            WHERE MONTH(entry_time) = MONTH(NOW()) AND YEAR(entry_time) = YEAR(NOW())
        """
        return Database.execute_query_one(query, fetch=False)
