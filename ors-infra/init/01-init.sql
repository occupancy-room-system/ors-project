-- ==============================================================================
-- ORS Infrastructure Initial Database Schema and Seed Data
-- Database Engine: MySQL 8.x (Mapped to Host Port 3307)
-- Database Name: orsdb
-- ==============================================================================

USE orsdb;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    account_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT,
    building VARCHAR(100) NOT NULL,
    floor_level INT NOT NULL DEFAULT 1,
    width_units INT NOT NULL DEFAULT 14,
    height_units INT NOT NULL DEFAULT 10,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rooms_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Seats Table
CREATE TABLE IF NOT EXISTS seats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id BIGINT NOT NULL,
    seat_code VARCHAR(30) NOT NULL,
    x_position INT NOT NULL,
    y_position INT NOT NULL,
    pod_label VARCHAR(50) DEFAULT NULL,
    table_type VARCHAR(20) NOT NULL DEFAULT 'INDIVIDUAL',
    group_table_id INT DEFAULT NULL,
    group_table_name VARCHAR(50) DEFAULT NULL,
    group_capacity INT DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    qr_token VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_seats_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    CONSTRAINT uq_room_seat_code UNIQUE (room_id, seat_code),
    INDEX idx_seats_status (status),
    INDEX idx_seats_room_status (room_id, status),
    INDEX idx_seats_qr_token (qr_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_name VARCHAR(100) NOT NULL,
    user_email VARCHAR(150) NOT NULL,
    seat_id BIGINT NOT NULL,
    seat_code VARCHAR(30) NOT NULL,
    pod_label VARCHAR(50) DEFAULT NULL,
    start_time TIMESTAMP NOT NULL,
    duration_hours INT NOT NULL DEFAULT 2,
    expires_at TIMESTAMP NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_ACTIVATION',
    is_group_reservation BOOLEAN DEFAULT FALSE,
    group_table_id INT DEFAULT NULL,
    group_table_name VARCHAR(50) DEFAULT NULL,
    total_seats_reserved INT DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_res_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_res_seat FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
    INDEX idx_res_user_status (user_id, status),
    INDEX idx_res_seat_status (seat_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Occupancy Sessions Table (Authoritative Session State)
CREATE TABLE IF NOT EXISTS occupancy_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    checked_in_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    checked_out_at TIMESTAMP NULL DEFAULT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_sessions_seat FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE RESTRICT,
    INDEX idx_sessions_user_status (user_id, status),
    INDEX idx_sessions_seat_status (seat_id, status),
    INDEX idx_sessions_expires_at (expires_at),
    INDEX idx_sessions_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Occupancy Events Table
CREATE TABLE IF NOT EXISTS occupancy_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    seat_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT NULL,
    INDEX idx_events_type_time (event_type, event_time),
    INDEX idx_events_user_time (user_id, event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_user_id BIGINT NOT NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    details TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_created_at (created_at),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- Initial Seed Data
-- ==============================================================================

-- 1. Insert Initial Users
-- Password for admin: AdminPass123! ($2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e)
-- Password for students: StudentPass123! ($2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e)
INSERT INTO users (id, username, email, password, full_name, role, account_status) VALUES
(1, 'admin', 'admin@university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Prof. Robert Vance (Admin)', 'ADMINISTRATOR', 'ACTIVE'),
(2, 'alex.chen', 'alex.chen@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Alex Chen (Student)', 'STUDENT', 'ACTIVE'),
(3, 'sarah.kim', 'sarah.kim@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Sarah Kim (Student)', 'STUDENT', 'ACTIVE'),
(4, 'marcus.taylor', 'marcus.taylor@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Marcus Taylor (Student)', 'STUDENT', 'ACTIVE'),
(5, 'emily.zhao', 'emily.zhao@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Emily Zhao (Student)', 'STUDENT', 'ACTIVE'),
(6, 'david.wong', 'david.wong@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'David Wong (Student)', 'STUDENT', 'ACTIVE'),
(7, 'lisa.tanaka', 'lisa.tanaka@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Lisa Tanaka (Student)', 'STUDENT', 'ACTIVE'),
(8, 'james.rodriguez', 'james.rodriguez@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'James Rodriguez (Student)', 'STUDENT', 'ACTIVE'),
(9, 'priya.patel', 'priya.patel@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Priya Patel (Student)', 'STUDENT', 'ACTIVE'),
(10, 'daniel.lee', 'daniel.lee@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Daniel Lee (Student)', 'STUDENT', 'ACTIVE'),
(11, 'chloe.dupont', 'chloe.dupont@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Chloe Dupont (Student)', 'STUDENT', 'ACTIVE'),
(12, 'ethan.brown', 'ethan.brown@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Ethan Brown (Student)', 'STUDENT', 'ACTIVE'),
(13, 'sophia.martinez', 'sophia.martinez@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Sophia Martinez (Student)', 'STUDENT', 'ACTIVE'),
(14, 'liam.wilson', 'liam.wilson@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Liam Wilson (Student)', 'STUDENT', 'ACTIVE'),
(15, 'olivia.davis', 'olivia.davis@student.university.edu', '$2a$10$4n92s0iVpXwZc7oZ2F8d.eaQ9eY4u1k3l6x5z4A8m7k6j5h4g3f2e', 'Olivia Davis (Student)', 'STUDENT', 'ACTIVE')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- 2. Insert Main Laboratory Room
INSERT INTO rooms (id, room_code, name, description, building, floor_level, width_units, height_units, status) VALUES
(1, 'SE-LAB-101', 'Software Engineering Innovation Lab', 'Main undergraduate collaborative engineering workspace with 54 workstations: Stations A-E (Individual) and Group Tables 1-5 (Group Booking).', 'Turing Hall of Computing', 1, 14, 10, 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 3. Insert All 54 Workstation Seats
INSERT INTO seats (id, room_id, seat_code, x_position, y_position, pod_label, table_type, group_table_id, group_table_name, group_capacity, status, qr_token) VALUES
-- Station A (6 Individual Desks)
(1, 1, 'SEAT-A1', 2, 2, 'Station A', 'INDIVIDUAL', NULL, NULL, NULL, 'RESERVED', 'QR-SELAB101-A1'),
(2, 1, 'SEAT-A2', 3, 2, 'Station A', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-A2'),
(3, 1, 'SEAT-A3', 4, 2, 'Station A', 'INDIVIDUAL', NULL, NULL, NULL, 'OCCUPIED', 'QR-SELAB101-A3'),
(4, 1, 'SEAT-A4', 2, 3, 'Station A', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-A4'),
(5, 1, 'SEAT-A5', 3, 3, 'Station A', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-A5'),
(6, 1, 'SEAT-A6', 4, 3, 'Station A', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-A6'),

-- Station B (6 Individual Desks)
(7, 1, 'SEAT-B1', 6, 2, 'Station B', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-B1'),
(8, 1, 'SEAT-B2', 7, 2, 'Station B', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-B2'),
(9, 1, 'SEAT-B3', 8, 2, 'Station B', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-B3'),
(10, 1, 'SEAT-B4', 6, 3, 'Station B', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-B4'),
(11, 1, 'SEAT-B5', 7, 3, 'Station B', 'INDIVIDUAL', NULL, NULL, NULL, 'EXPIRING_SOON', 'QR-SELAB101-B5'),
(12, 1, 'SEAT-B6', 8, 3, 'Station B', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-B6'),

-- Group Table 1 (2 Desks)
(13, 1, 'SEAT-GT1-1', 10, 2, 'Group Table 1', 'GROUP', 1, 'Group Table 1', 2, 'AVAILABLE', 'QR-SELAB101-GT1-1'),
(14, 1, 'SEAT-GT1-2', 10, 3, 'Group Table 1', 'GROUP', 1, 'Group Table 1', 2, 'AVAILABLE', 'QR-SELAB101-GT1-2'),

-- Group Table 2 (9 Desks)
(15, 1, 'SEAT-GT2-1', 12, 1, 'Group Table 2', 'GROUP', 2, 'Group Table 2', 9, 'AVAILABLE', 'QR-SELAB101-GT2-1'),
(16, 1, 'SEAT-GT2-2', 13, 1, 'Group Table 2', 'GROUP', 2, 'Group Table 2', 9, 'AVAILABLE', 'QR-SELAB101-GT2-2'),
(17, 1, 'SEAT-GT2-3', 12, 2, 'Group Table 2', 'GROUP', 2, 'Group Table 2', 9, 'AVAILABLE', 'QR-SELAB101-GT2-3'),
(18, 1, 'SEAT-GT2-4', 13, 2, 'Group Table 2', 'GROUP', 2, 'Group Table 2', 9, 'AVAILABLE', 'QR-SELAB101-GT2-4'),
(19, 1, 'SEAT-GT2-5', 12, 3, 'Group Table 2', 'GROUP', 2, 'Group Table 2', 9, 'AVAILABLE', 'QR-SELAB101-GT2-5'),
(20, 1, 'SEAT-GT2-6', 13, 3, 'Group Table 2', 'GROUP', 2, 'Group Table 2', 9, 'AVAILABLE', 'QR-SELAB101-GT2-6'),
(21, 1, 'SEAT-GT2-7', 12, 4, 'Group Table 2', 'GROUP', 2, 'Group Table 2', 9, 'AVAILABLE', 'QR-SELAB101-GT2-7'),
(22, 1, 'SEAT-GT2-8', 13, 4, 'Group Table 2', 'GROUP', 2, 'Group Table 2', 9, 'AVAILABLE', 'QR-SELAB101-GT2-8'),
(23, 1, 'SEAT-GT2-9', 12, 5, 'Group Table 2', 'GROUP', 2, 'Group Table 2', 9, 'AVAILABLE', 'QR-SELAB101-GT2-9'),

-- Group Table 3 (9 Desks)
(24, 1, 'SEAT-GT3-1', 12, 6, 'Group Table 3', 'GROUP', 3, 'Group Table 3', 9, 'AVAILABLE', 'QR-SELAB101-GT3-1'),
(25, 1, 'SEAT-GT3-2', 13, 6, 'Group Table 3', 'GROUP', 3, 'Group Table 3', 9, 'AVAILABLE', 'QR-SELAB101-GT3-2'),
(26, 1, 'SEAT-GT3-3', 12, 7, 'Group Table 3', 'GROUP', 3, 'Group Table 3', 9, 'AVAILABLE', 'QR-SELAB101-GT3-3'),
(27, 1, 'SEAT-GT3-4', 13, 7, 'Group Table 3', 'GROUP', 3, 'Group Table 3', 9, 'AVAILABLE', 'QR-SELAB101-GT3-4'),
(28, 1, 'SEAT-GT3-5', 12, 8, 'Group Table 3', 'GROUP', 3, 'Group Table 3', 9, 'AVAILABLE', 'QR-SELAB101-GT3-5'),
(29, 1, 'SEAT-GT3-6', 13, 8, 'Group Table 3', 'GROUP', 3, 'Group Table 3', 9, 'AVAILABLE', 'QR-SELAB101-GT3-6'),
(30, 1, 'SEAT-GT3-7', 12, 9, 'Group Table 3', 'GROUP', 3, 'Group Table 3', 9, 'AVAILABLE', 'QR-SELAB101-GT3-7'),
(31, 1, 'SEAT-GT3-8', 13, 9, 'Group Table 3', 'GROUP', 3, 'Group Table 3', 9, 'AVAILABLE', 'QR-SELAB101-GT3-8'),
(32, 1, 'SEAT-GT3-9', 12, 10, 'Group Table 3', 'GROUP', 3, 'Group Table 3', 9, 'AVAILABLE', 'QR-SELAB101-GT3-9'),

-- Station C (4 Individual Desks)
(33, 1, 'SEAT-C1', 2, 5, 'Station C', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-C1'),
(34, 1, 'SEAT-C2', 3, 5, 'Station C', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-C2'),
(35, 1, 'SEAT-C3', 2, 6, 'Station C', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-C3'),
(36, 1, 'SEAT-C4', 3, 6, 'Station C', 'INDIVIDUAL', NULL, NULL, NULL, 'MAINTENANCE', 'QR-SELAB101-C4'),

-- Station D (4 Individual Desks)
(37, 1, 'SEAT-D1', 5, 5, 'Station D', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-D1'),
(38, 1, 'SEAT-D2', 6, 5, 'Station D', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-D2'),
(39, 1, 'SEAT-D3', 5, 6, 'Station D', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-D3'),
(40, 1, 'SEAT-D4', 6, 6, 'Station D', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-D4'),

-- Station E (2 Individual Desks)
(41, 1, 'SEAT-E1', 8, 5, 'Station E', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-E1'),
(42, 1, 'SEAT-E2', 9, 5, 'Station E', 'INDIVIDUAL', NULL, NULL, NULL, 'AVAILABLE', 'QR-SELAB101-E2'),

-- Group Table 4 (6 Desks)
(43, 1, 'SEAT-GT4-1', 2, 8, 'Group Table 4', 'GROUP', 4, 'Group Table 4', 6, 'AVAILABLE', 'QR-SELAB101-GT4-1'),
(44, 1, 'SEAT-GT4-2', 3, 8, 'Group Table 4', 'GROUP', 4, 'Group Table 4', 6, 'AVAILABLE', 'QR-SELAB101-GT4-2'),
(45, 1, 'SEAT-GT4-3', 4, 8, 'Group Table 4', 'GROUP', 4, 'Group Table 4', 6, 'AVAILABLE', 'QR-SELAB101-GT4-3'),
(46, 1, 'SEAT-GT4-4', 2, 9, 'Group Table 4', 'GROUP', 4, 'Group Table 4', 6, 'AVAILABLE', 'QR-SELAB101-GT4-4'),
(47, 1, 'SEAT-GT4-5', 3, 9, 'Group Table 4', 'GROUP', 4, 'Group Table 4', 6, 'AVAILABLE', 'QR-SELAB101-GT4-5'),
(48, 1, 'SEAT-GT4-6', 4, 9, 'Group Table 4', 'GROUP', 4, 'Group Table 4', 6, 'AVAILABLE', 'QR-SELAB101-GT4-6'),

-- Group Table 5 (6 Desks)
(49, 1, 'SEAT-GT5-1', 6, 8, 'Group Table 5', 'GROUP', 5, 'Group Table 5', 6, 'AVAILABLE', 'QR-SELAB101-GT5-1'),
(50, 1, 'SEAT-GT5-2', 7, 8, 'Group Table 5', 'GROUP', 5, 'Group Table 5', 6, 'AVAILABLE', 'QR-SELAB101-GT5-2'),
(51, 1, 'SEAT-GT5-3', 8, 8, 'Group Table 5', 'GROUP', 5, 'Group Table 5', 6, 'AVAILABLE', 'QR-SELAB101-GT5-3'),
(52, 1, 'SEAT-GT5-4', 6, 9, 'Group Table 5', 'GROUP', 5, 'Group Table 5', 6, 'AVAILABLE', 'QR-SELAB101-GT5-4'),
(53, 1, 'SEAT-GT5-5', 7, 9, 'Group Table 5', 'GROUP', 5, 'Group Table 5', 6, 'AVAILABLE', 'QR-SELAB101-GT5-5'),
(54, 1, 'SEAT-GT5-6', 8, 9, 'Group Table 5', 'GROUP', 5, 'Group Table 5', 6, 'AVAILABLE', 'QR-SELAB101-GT5-6')
ON DUPLICATE KEY UPDATE seat_code=VALUES(seat_code);

-- 4. Initial Reservations
INSERT INTO reservations (id, user_id, user_name, user_email, seat_id, seat_code, pod_label, start_time, duration_hours, expires_at, status) VALUES
(1, 2, 'Alex Chen (Student)', 'alex.chen@student.university.edu', 1, 'SEAT-A1', 'Station A', DATE_ADD(NOW(), INTERVAL 15 MINUTE), 2, DATE_ADD(NOW(), INTERVAL 35 MINUTE), 'PENDING_ACTIVATION')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 5. Initial Active Occupancy Sessions
INSERT INTO occupancy_sessions (id, user_id, seat_id, checked_in_at, expires_at, status) VALUES
(1, 6, 3, DATE_SUB(NOW(), INTERVAL 45 MINUTE), DATE_ADD(NOW(), INTERVAL 75 MINUTE), 'ACTIVE'),
(2, 4, 11, DATE_SUB(NOW(), INTERVAL 110 MINUTE), DATE_ADD(NOW(), INTERVAL 10 MINUTE), 'ACTIVE')
ON DUPLICATE KEY UPDATE status=VALUES(status);

-- 6. Initial Audit Log
INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, details) VALUES
(1, 1, 'SYSTEM_INITIALIZATION', 'SYSTEM', '1', '{"note": "Initial room and 54 workstations created for SE Lab 101"}')
ON DUPLICATE KEY UPDATE action=VALUES(action);

