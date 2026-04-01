-- Sample seed: create a relation and a test reservation (new flow)
-- Adjust user IDs as needed for your environment

USE `imw-parking_database`;

-- Example: link user 4 (Jean Dupont) as owner to user 6 (proche)
INSERT INTO user_relations (user_id, proche_user_id, relation_type) VALUES (4, 6, 'family');

-- Create a vehicle for proche (if not exists)
INSERT IGNORE INTO vehicles (license_plate, vehicle_type, user_id) VALUES ('NC-001', 'Voiture', 6);

-- Create reservation for proche by owner 4
INSERT INTO reservations (user_id, nom_proche, license_plate, vehicle_type, date_reservation, montant, statut, place_number, created_by)
VALUES (6, 'Proche Test', 'NC-001', 'Voiture', CURDATE(), 5.00, 'PENDING', 'A03', 4);

-- Create parking entry and payment (simulate complete flow)
INSERT INTO parking_entries (license_plate, vehicle_id, agent_id, spot_number, vehicle_type, status)
VALUES ('NC-001', (SELECT id FROM vehicles WHERE license_plate='NC-001' LIMIT 1), 4, 'A03', 'Voiture', 'IN');

INSERT INTO payments (reservation_id, amount, payment_method, payment_status, paid_at)
VALUES (LAST_INSERT_ID(), 5.00, 'ONLINE', 'PAID', NOW());
