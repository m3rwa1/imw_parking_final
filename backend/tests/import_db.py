import mysql.connector

def run_sql_file():
    conn = mysql.connector.connect(host='localhost', user='root', password='')
    cursor = conn.cursor()
    
    # Create DB and select it
    cursor.execute('CREATE DATABASE IF NOT EXISTS `imw-parking_database`')
    cursor.execute('USE `imw-parking_database`')
    
    with open('database.sql', 'r', encoding='utf-8') as f:
        sql_file = f.read()
        
    # Split by semicolon and execute (handling multiple statements properly in mysql-connector)
    # The better way in Python for mysql is using iterator
    for result in cursor.execute(sql_file, multi=True):
        pass

    conn.commit()
    cursor.close()
    conn.close()
    print("Base de données importée avec succès ! (Tables et données initiales insérées)")

if __name__ == '__main__':
    run_sql_file()
