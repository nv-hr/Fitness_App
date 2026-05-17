CREATE DATABASE IF NOT EXISTS fitness_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fitness_app;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NULL,
  google_id VARCHAR(255) UNIQUE NULL,
  pdp_consent TINYINT(1) DEFAULT 0,
  pdp_consent_date DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  weight_kg DECIMAL(5,2) NOT NULL,
  height_cm DECIMAL(5,2) NOT NULL,
  age INT NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  fitness_goal ENUM('lose_weight', 'maintain', 'gain_weight') NOT NULL,
  activity_level ENUM('low', 'medium', 'high') NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Food Database Tables (Phase 04)
-- ============================================================

-- foods table: single table for seeded + custom foods (D-30)
-- Seeded foods: user_id=NULL, is_custom=FALSE
-- Custom foods: user_id=set, is_custom=TRUE
CREATE TABLE IF NOT EXISTS foods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  calories_per_100g INT NOT NULL,
  category ENUM('makanan_pokok', 'lauk', 'sayur', 'buah', 'minuman', 'snack', 'lainnya') NOT NULL,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_user_category (user_id, category),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- food_logs table: daily food logging (D-33)
-- Supports seeded foods (food_id set) and custom one-off entries (custom_food_name set)
CREATE TABLE IF NOT EXISTS food_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  food_id INT NULL,
  custom_food_name VARCHAR(255) NULL,
  calories INT NOT NULL,
  portion_grams INT NOT NULL,
  log_date DATE NOT NULL,
  meal_type ENUM('sarapan', 'makan_siang', 'makan_malam', 'camilan') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, log_date),
  INDEX idx_user_recent (user_id, log_date DESC),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- Seed Data: 100+ Indonesian Foods (D-31, D-32)
-- All seeded foods: is_custom=FALSE (0), user_id=NULL
-- ============================================================

-- makanan_pokok (15 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Nasi putih', 180, 'makanan_pokok', FALSE),
(NULL, 'Nasi goreng', 220, 'makanan_pokok', FALSE),
(NULL, 'Mie goreng', 190, 'makanan_pokok', FALSE),
(NULL, 'Mie rebus', 120, 'makanan_pokok', FALSE),
(NULL, 'Roti putih', 248, 'makanan_pokok', FALSE),
(NULL, 'Kentang rebus', 87, 'makanan_pokok', FALSE),
(NULL, 'Ubi jalar', 123, 'makanan_pokok', FALSE),
(NULL, 'Bubur ayam', 99, 'makanan_pokok', FALSE),
(NULL, 'Lontong', 129, 'makanan_pokok', FALSE),
(NULL, 'Nasi uduk', 175, 'makanan_pokok', FALSE),
(NULL, 'Nasi kuning', 160, 'makanan_pokok', FALSE),
(NULL, 'Bubur kacang hijau', 120, 'makanan_pokok', FALSE),
(NULL, 'Singkong rebus', 121, 'makanan_pokok', FALSE),
(NULL, 'Jagung rebus', 96, 'makanan_pokok', FALSE),
(NULL, 'Soto mie', 110, 'makanan_pokok', FALSE);

-- lauk (25 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Rendang sapi', 193, 'lauk', FALSE),
(NULL, 'Ayam goreng', 260, 'lauk', FALSE),
(NULL, 'Ayam bakar', 180, 'lauk', FALSE),
(NULL, 'Sate ayam', 180, 'lauk', FALSE),
(NULL, 'Soto ayam', 80, 'lauk', FALSE),
(NULL, 'Ikan goreng', 210, 'lauk', FALSE),
(NULL, 'Ikan bakar', 150, 'lauk', FALSE),
(NULL, 'Tempe goreng', 170, 'lauk', FALSE),
(NULL, 'Tempe bacem', 150, 'lauk', FALSE),
(NULL, 'Tahu goreng', 160, 'lauk', FALSE),
(NULL, 'Tahu bacem', 120, 'lauk', FALSE),
(NULL, 'Telur dadar', 180, 'lauk', FALSE),
(NULL, 'Telur rebus', 155, 'lauk', FALSE),
(NULL, 'Telur ceplok', 190, 'lauk', FALSE),
(NULL, 'Pepes ikan', 140, 'lauk', FALSE),
(NULL, 'Gulai ayam', 200, 'lauk', FALSE),
(NULL, 'Rawon', 160, 'lauk', FALSE),
(NULL, 'Sop buntut', 180, 'lauk', FALSE),
(NULL, 'Bakso', 150, 'lauk', FALSE),
(NULL, 'Sate kambing', 200, 'lauk', FALSE),
(NULL, 'Ayam geprek', 250, 'lauk', FALSE),
(NULL, 'Lele goreng', 230, 'lauk', FALSE),
(NULL, 'Udang goreng', 200, 'lauk', FALSE),
(NULL, 'Cumi goreng', 180, 'lauk', FALSE),
(NULL, 'Perkedel', 190, 'lauk', FALSE);

-- sayur (10 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Gado-gado', 120, 'sayur', FALSE),
(NULL, 'Sayur bayam', 30, 'sayur', FALSE),
(NULL, 'Sayur sop', 45, 'sayur', FALSE),
(NULL, 'Urap sayuran', 85, 'sayur', FALSE),
(NULL, 'Lalapan', 25, 'sayur', FALSE),
(NULL, 'Sayur lodeh', 70, 'sayur', FALSE),
(NULL, 'Capcay', 60, 'sayur', FALSE),
(NULL, 'Karedok', 90, 'sayur', FALSE),
(NULL, 'Plecing kangkung', 45, 'sayur', FALSE),
(NULL, 'Tumis kangkung', 50, 'sayur', FALSE);

-- buah (12 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Pisang', 100, 'buah', FALSE),
(NULL, 'Jeruk', 47, 'buah', FALSE),
(NULL, 'Mangga', 60, 'buah', FALSE),
(NULL, 'Pepaya', 39, 'buah', FALSE),
(NULL, 'Semangka', 30, 'buah', FALSE),
(NULL, 'Apel', 52, 'buah', FALSE),
(NULL, 'Alpukat', 85, 'buah', FALSE),
(NULL, 'Jambu biji', 50, 'buah', FALSE),
(NULL, 'Durian', 150, 'buah', FALSE),
(NULL, 'Salak', 60, 'buah', FALSE),
(NULL, 'Rambutan', 70, 'buah', FALSE),
(NULL, 'Manggis', 65, 'buah', FALSE);

-- minuman (10 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Teh manis', 40, 'minuman', FALSE),
(NULL, 'Kopi susu', 55, 'minuman', FALSE),
(NULL, 'Es jeruk', 45, 'minuman', FALSE),
(NULL, 'Jus alpukat', 90, 'minuman', FALSE),
(NULL, 'Es teh', 5, 'minuman', FALSE),
(NULL, 'Es kopi', 30, 'minuman', FALSE),
(NULL, 'Susu coklat', 80, 'minuman', FALSE),
(NULL, 'Wedang jahe', 25, 'minuman', FALSE),
(NULL, 'Jus mangga', 60, 'minuman', FALSE),
(NULL, 'Es campur', 75, 'minuman', FALSE);

-- snack (15 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Kue lapis', 220, 'snack', FALSE),
(NULL, 'Risol', 200, 'snack', FALSE),
(NULL, 'Martabak manis', 300, 'snack', FALSE),
(NULL, 'Klepon', 180, 'snack', FALSE),
(NULL, 'Kerupuk', 450, 'snack', FALSE),
(NULL, 'Pisang goreng', 200, 'snack', FALSE),
(NULL, 'Cireng', 180, 'snack', FALSE),
(NULL, 'Bakwan', 170, 'snack', FALSE),
(NULL, 'Lemper', 190, 'snack', FALSE),
(NULL, 'Arema', 160, 'snack', FALSE),
(NULL, 'Martabak telur', 250, 'snack', FALSE),
(NULL, 'Otak-otak', 140, 'snack', FALSE),
(NULL, 'Pastel', 210, 'snack', FALSE),
(NULL, 'Combro', 180, 'snack', FALSE),
(NULL, 'Getuk', 160, 'snack', FALSE);

-- lainnya (8 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Kecap manis', 290, 'lainnya', FALSE),
(NULL, 'Sambal', 50, 'lainnya', FALSE),
(NULL, 'Minyak goreng', 900, 'lainnya', FALSE),
(NULL, 'Santan', 230, 'lainnya', FALSE),
(NULL, 'Gula pasir', 387, 'lainnya', FALSE),
(NULL, 'Terasi', 30, 'lainnya', FALSE),
(NULL, 'Bawang goreng', 520, 'lainnya', FALSE),
(NULL, 'Selai kacang', 590, 'lainnya', FALSE);

-- Additional foods to reach 100+
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Nasi padang', 230, 'makanan_pokok', FALSE),
(NULL, 'Nasi pecel', 200, 'makanan_pokok', FALSE),
(NULL, 'Mie ayam', 170, 'makanan_pokok', FALSE),
(NULL, 'Ikan asam manis', 180, 'lauk', FALSE),
(NULL, 'Ayam rica-rica', 190, 'lauk', FALSE),
(NULL, 'Sayur asem', 40, 'sayur', FALSE),
(NULL, 'Es teler', 85, 'minuman', FALSE),
(NULL, 'Dadar gulung', 200, 'snack', FALSE),
(NULL, 'Nagasari', 170, 'snack', FALSE),
(NULL, 'Serundeng', 450, 'lainnya', FALSE);
