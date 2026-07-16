-- =====================================================
-- Smart College Bus Management System
-- Database schema + seed data
-- =====================================================

CREATE DATABASE IF NOT EXISTS bus_management;
USE bus_management;

-- ---------------------------------------------------
-- Table: users  (admin / student / driver login accounts)
-- ---------------------------------------------------
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS fees;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'student', 'driver') NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- Table: buses
-- ---------------------------------------------------
CREATE TABLE buses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bus_number VARCHAR(20) NOT NULL UNIQUE,
  route_name VARCHAR(150) NOT NULL,
  capacity INT NOT NULL DEFAULT 40,
  driver_id INT DEFAULT NULL,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------
-- Table: students (extra profile info linked to users)
-- ---------------------------------------------------
CREATE TABLE students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  roll_no VARCHAR(30) NOT NULL UNIQUE,
  department VARCHAR(100),
  year VARCHAR(30),
  address VARCHAR(255),
  bus_id INT DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL
);

-- ---------------------------------------------------
-- Table: fees
-- ---------------------------------------------------
CREATE TABLE fees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status ENUM('paid', 'unpaid') DEFAULT 'unpaid',
  due_date DATE,
  paid_date DATE DEFAULT NULL,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ---------------------------------------------------
-- Table: requests (student transport requests / complaints)
-- ---------------------------------------------------
CREATE TABLE requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  subject VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- =====================================================
-- SEED DATA
-- Passwords below are bcrypt-hashed. Plain-text versions:
--   admin   -> admin123
--   drivers -> driver123
--   students-> student123
-- =====================================================

-- ---------------- Users ----------------
INSERT INTO users (name, email, password, role, phone) VALUES
('Admin User', 'admin@college.edu', '$2a$10$9X3ceXIqPsfcUPC5HpZHfOC/gwx5TpQl0OD5nWVMLvP4dIVxna5Wm', 'admin', '9000000001'),
('Ramesh Kumar', 'driver1@college.edu', '$2a$10$YDF0VAJEGVhfpdr28D3KVen2XW30vi8PDYGFb2/WLESAgSeKh1k3i', 'driver', '9000000002'),
('Suresh Patil', 'driver2@college.edu', '$2a$10$YDF0VAJEGVhfpdr28D3KVen2XW30vi8PDYGFb2/WLESAgSeKh1k3i', 'driver', '9000000003'),
('Aarav Sharma', 'student1@college.edu', '$2a$10$KbLxSTRuQCt3ZyuHx9lYc.wI1gX0XxW.QZoQIH4ax23imS7kad5tK', 'student', '9000000004'),
('Priya Verma', 'student2@college.edu', '$2a$10$KbLxSTRuQCt3ZyuHx9lYc.wI1gX0XxW.QZoQIH4ax23imS7kad5tK', 'student', '9000000005'),
('Rohan Gupta', 'student3@college.edu', '$2a$10$KbLxSTRuQCt3ZyuHx9lYc.wI1gX0XxW.QZoQIH4ax23imS7kad5tK', 'student', '9000000006');

-- ---------------- Buses ----------------
-- driver_id 2 -> Ramesh Kumar, driver_id 3 -> Suresh Patil
INSERT INTO buses (bus_number, route_name, capacity, driver_id, status) VALUES
('BUS-01', 'City Center - Main Campus', 40, 2, 'active'),
('BUS-02', 'Railway Station - Main Campus', 35, 3, 'active'),
('BUS-03', 'Airport Road - Main Campus', 30, NULL, 'inactive');

-- ---------------- Students ----------------
-- user_id 4 -> Aarav, 5 -> Priya, 6 -> Rohan
INSERT INTO students (user_id, roll_no, department, year, address, bus_id) VALUES
(4, 'CS2023001', 'Computer Science', '2nd Year', '12 MG Road, City Center', 1),
(5, 'EC2023045', 'Electronics', '3rd Year', '45 Station Road', 2),
(6, 'ME2023078', 'Mechanical', '1st Year', '78 Airport Road', NULL);

-- ---------------- Fees ----------------
INSERT INTO fees (student_id, amount, status, due_date, paid_date) VALUES
(1, 5000.00, 'paid', '2026-01-15', '2026-01-10'),
(2, 5000.00, 'unpaid', '2026-07-15', NULL),
(3, 5000.00, 'unpaid', '2026-07-15', NULL);

-- ---------------- Requests ----------------
INSERT INTO requests (student_id, subject, message, status) VALUES
(1, 'Route Timing Change', 'Can the bus arrive 10 minutes earlier at the City Center stop?', 'pending'),
(2, 'Seat Issue', 'The seat near the window is broken on BUS-02.', 'approved'),
(3, 'Bus Assignment Request', 'I have not been assigned a bus yet, please assign one for the Airport Road route.', 'pending');
