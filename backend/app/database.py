import mysql.connector
from contextlib import contextmanager
from flask import current_app

class Database:
    """Database connection manager"""

    @staticmethod
    def _connection_config():
        """Build base connection config from environment."""
        return {
            'host': current_app.config['MYSQL_HOST'],
            'user': current_app.config['MYSQL_USER'],
            'password': current_app.config['MYSQL_PASSWORD'],
            'database': current_app.config['MYSQL_DATABASE'],
        }

    @staticmethod
    def get_connection():
        """Create and return a MySQL connection"""
        config = Database._connection_config()
        try:
            connection = mysql.connector.connect(**config)
            return connection
        except mysql.connector.Error as err:
            # MySQL names are case-sensitive on many Linux setups.
            # Retry once with lowercase database name when only case differs.
            db_name = str(config.get('database', ''))
            if err.errno == mysql.connector.errorcode.ER_BAD_DB_ERROR and db_name and db_name != db_name.lower():
                retry_config = {**config, 'database': db_name.lower()}
                try:
                    return mysql.connector.connect(**retry_config)
                except mysql.connector.Error:
                    pass

            current_app.logger.error(f"Database Connection Error: {err}")
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
        with Database.get_db() as conn:
            if conn is None:
                return None
            try:
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
                current_app.logger.error(f"Query Error: {err}")
                return None
    
    @staticmethod
    def execute_query_one(query, params=None):
        """Execute a query and fetch one result"""
        with Database.get_db() as conn:
            if conn is None:
                return None
            try:
                cursor = conn.cursor(dictionary=True)
                cursor.execute(query, params or ())
                result = cursor.fetchone()
                cursor.close()
                return result
            except mysql.connector.Error as err:
                current_app.logger.error(f"Query Error: {err}")
                return None
