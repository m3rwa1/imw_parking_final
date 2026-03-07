CREATE DATABASE IF NOT EXISTS `IMW-PARKING_DATABASE`;
USE `IMW-PARKING_DATABASE`;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'MANAGER', 'AGENT', 'CLIENT') NOT NULL DEFAULT 'CLIENT',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Vehicles Table
CREATE TABLE IF NOT EXISTS vehicles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vehicle_type ENUM('Voiture', 'Moto', 'Camion') DEFAULT 'Voiture',
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_plate (license_plate),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Parking Entries Table
CREATE TABLE IF NOT EXISTS parking_entries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    license_plate VARCHAR(20) NOT NULL,
    entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exit_time TIMESTAMP NULL,
    spot_number VARCHAR(10),
    vehicle_type ENUM('Voiture', 'Moto', 'Camion') DEFAULT 'Voiture',
    status ENUM('IN', 'OUT') DEFAULT 'IN',
    price DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_plate (license_plate),
    INDEX idx_status (status),
    INDEX idx_entry_time (entry_time),
    INDEX idx_spot (spot_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Subscriptions Table
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    vehicle_id INT,
    license_plate VARCHAR(20) NOT NULL,
    plan_type ENUM('HOURLY', 'MONTHLY', 'ANNUAL') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_plate (license_plate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reclamations/Complaints Table
CREATE TABLE IF NOT EXISTS reclamations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Activity Log Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Data (mêmes que dans l’autre fichier)
INSERT INTO users (name, email, password, role) 
VALUES ('Admin IMW', 'admin@imw.com', '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'ADMIN');

INSERT INTO users (name, email, password, role)
VALUES ('Manager IMW', 'manager@imw.com', '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'MANAGER');

INSERT INTO users (name, email, password, role)
VALUES ('Agent 1', 'agent1@imw.com', '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'AGENT');

INSERT INTO users (name, email, password, role)
VALUES 
('Jean Dupont', 'jean@example.com', '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'CLIENT'),
('Marie Curie', 'marie@example.com', '$2b$12$VqBZq/LS/ZIRbBE2OkHnCOmBo/q3l4FqZZRThpcHxUDbwypAGdkt.', 'CLIENT');

INSERT INTO vehicles (license_plate, vehicle_type, user_id)
VALUES 
('AB-123-CD', 'Voiture', 4),
('XY-987-ZZ', 'Moto', 5),
('EF-456-GH', 'Camion', 4);

INSERT INTO parking_entries (license_plate, entry_time, exit_time, spot_number, vehicle_type, status, price)
VALUES 
('AB-123-CD', DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, 'A-12', 'Voiture', 'IN', NULL),
('XY-987-ZZ', DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 1 HOUR), 'B-05', 'Moto', 'OUT', 5.50),
('EF-456-GH', DATE_SUB(NOW(), INTERVAL 4 HOUR), NULL, 'C-01', 'Camion', 'IN', NULL);

INSERT INTO subscriptions (user_id, vehicle_id, license_plate, plan_type, start_date, end_date, status)
VALUES 
(4, 1, 'AB-123-CD', 'MONTHLY', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'ACTIVE'),
(5, 2, 'XY-987-ZZ', 'ANNUAL', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 365 DAY), 'ACTIVE');

INSERT INTO reclamations (user_id, subject, description, status)
VALUES 
(4, 'Problème barrière entrée', 'La barrière à lentrée ne fonctionne pas correctement', 'OPEN'),
(5, 'Erreur facturation', 'Jai été facturisé deux fois pour le même stationnement', 'IN_PROGRESS');

INSERT INTO activity_logs (user_id, action, description)
VALUES 
(1, 'LOGIN', 'Admin login'),
(2, 'LOGIN', 'Manager login'),
(3, 'VEHICLE_ENTRY', 'Vehicle AB-123-CD entered'),
(3, 'VEHICLE_EXIT', 'Vehicle XY-987-ZZ exited');