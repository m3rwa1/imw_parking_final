import mysql.connector
from contextlib import contextmanager
from flask import current_app

class Database:
    """Database connection manager"""
    
    @staticmethod
    def get_connection():
        """Create and return a MySQL connection"""
        try:
            connection = mysql.connector.connect(
                host=current_app.config['MYSQL_HOST'],
                user=current_app.config['MYSQL_USER'],
                password=current_app.config['MYSQL_PASSWORD'],
                database=current_app.config['MYSQL_DATABASE']
            )
            return connection
        except mysql.connector.Error as err:
            print(f"Database Connection Error: {err}")
            return None
    
    @staticmethod
    @contextmanager
    def get_db():
        """Context manager for database connections"""
        conn = Database.get_connection()
        try:
            yield conn
        finally:
            if conn:
                conn.close()
    
    @staticmethod
    def execute_query(query, params=None, fetch=False):
        """Execute a query and optionally fetch results"""
        try:
            with Database.get_db() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(query, params or ())
                
                if fetch:
                    result = cursor.fetchall()
                else:
                    conn.commit()
                    result = cursor.rowcount
                
                cursor.close()
                return result
        except mysql.connector.Error as err:
            print(f"Query Error: {err}")
            return None
    
    @staticmethod
    def execute_query_one(query, params=None):
        """Execute a query and fetch one result"""
        try:
            with Database.get_db() as conn:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(query, params or ())
                result = cursor.fetchone()
                cursor.close()
                return result
        except mysql.connector.Error as err:
            print(f"Query Error: {err}")
            return None
