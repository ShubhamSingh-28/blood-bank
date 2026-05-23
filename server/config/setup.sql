CREATE DATABASE IF NOT EXISTS blood_bank;
USE blood_bank;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('hospital','receiver') NOT NULL,
  blood_group VARCHAR(5),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blood_inventory (
  id INT PRIMARY KEY AUTO_INCREMENT,
  hospital_id INT NOT NULL,
  blood_group VARCHAR(5) NOT NULL,
  units INT NOT NULL,
  FOREIGN KEY (hospital_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_hospital_blood (hospital_id, blood_group)
);

CREATE TABLE IF NOT EXISTS blood_requests (
  id INT PRIMARY KEY AUTO_INCREMENT,
  receiver_id INT NOT NULL,
  hospital_id INT NOT NULL,
  blood_group VARCHAR(5) NOT NULL,
  status ENUM('pending','approved','rejected') DEFAULT 'pending',
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (hospital_id) REFERENCES users(id) ON DELETE CASCADE
);
