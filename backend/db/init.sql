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
-- Activity Recommendations Tables (Phase 05)
-- ============================================================

CREATE TABLE IF NOT EXISTS activities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  duration_min INT NOT NULL,
  estimated_calories INT NOT NULL,
  goal_tags JSON NOT NULL,
  equipment_needed JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  activity_id INT NOT NULL,
  completed_date DATE NOT NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, completed_date),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- Seed Data: 35 Indonesian Home Exercises (Phase 05)
-- ============================================================

-- Cardio (lose_weight focused)
INSERT INTO activities (name, description, duration_min, estimated_calories, goal_tags, equipment_needed) VALUES
('Jalan cepat di tempat', 'Berjalan cepat di tempat dengan mengangkat lutut tinggi. Gerakan ringan yang cocok untuk pemula.', 15, 80, '["lose_weight", "maintain"]', '[]'),
('Jumping jacks', 'Lompat dengan membuka kaki dan mengangkat tangan ke atas secara bersamaan. Gerakan cardio klasik.', 10, 100, '["lose_weight", "maintain"]', '[]'),
('High knees', 'Berlari di tempat dengan mengangkat lutut setinggi pinggang. Tingkatkan intensitas secara bertahap.', 10, 110, '["lose_weight"]', '[]'),
('Lari di tempat', 'Berlari di tempat dengan langkah cepat dan konsisten. Jaga postur tubuh tetap tegak.', 20, 200, '["lose_weight"]', '[]'),
('Skipping tanpa tali', 'Melompat kecil seolah-olah sedang melompati tali. Gerakan ringan untuk cardio.', 10, 90, '["lose_weight", "maintain"]', '[]'),
('Dance cardio', 'Menari bebas mengikuti musik dengan gerakan energik. Latihan cardio yang menyenangkan.', 30, 200, '["lose_weight", "maintain"]', '[]'),

-- Bodyweight strength (gain_weight focused)
('Push-up', 'Latihan kekuatan dada dan lengan. Posisi tengkurap, dorong tubuh ke atas dengan tangan.', 10, 50, '["lose_weight", "maintain", "gain_weight"]', '[]'),
('Squat', 'Berdiri dengan kaki selebar bahu, turunkan tubuh seperti duduk di kursi, lalu berdiri kembali.', 15, 100, '["lose_weight", "maintain", "gain_weight"]', '[]'),
('Lunges', 'Langkah maju dengan satu kaki, turunkan lutut belakang hingga hampir menyentuh lantai.', 15, 90, '["lose_weight", "maintain", "gain_weight"]', '[]'),
('Plank', 'Tahan posisi tubuh lurus seperti papan dengan bertumpu pada lengan bawah dan ujung kaki.', 10, 40, '["lose_weight", "maintain", "gain_weight"]', '[]'),
('Wall sit', 'Sandarkan punggung di dinding dengan posisi duduk imajiner. Tahan selama mungkin.', 10, 60, '["lose_weight", "gain_weight"]', '[]'),
('Glute bridge', 'Berbaring telentang, tekuk lutut, angkat pinggul ke atas hingga tubuh membentuk garis lurus.', 15, 70, '["maintain", "gain_weight"]', '[]'),
('Tricep dips dengan kursi', 'Duduk di tepi kursi, letakkan tangan di samping pinggul, turunkan dan angkat tubuh dengan lengan.', 10, 50, '["gain_weight"]', '["kursi"]'),
('Pike push-up', 'Push-up dengan posisi pinggul terangkat tinggi membentuk huruf V terbalik. Fokus pada bahu.', 10, 55, '["gain_weight"]', '[]'),

-- Flexibility/balance (maintain focused)
('Yoga matahari', 'Rangkaian gerakan yoga dasar: mountain pose, forward fold, plank, cobra, dan downward dog.', 20, 80, '["maintain"]', '["matras"]'),
('Peregangan leher', 'Miringkan kepala ke kiri dan kanan, tahan 15 detik tiap sisi. Ulangi beberapa kali.', 5, 15, '["maintain"]', '[]'),
('Peregangan punggung', 'Duduk bersila, putar tubuh ke kiri dan kanan perlahan. Jaga napas tetap teratur.', 10, 25, '["maintain"]', '[]'),
('Cat-cow stretch', 'Posisi merangkak, lengkungkan punggung ke atas (cat) lalu ke bawah (cow) secara bergantian.', 10, 30, '["maintain"]', '["matras"]'),
('Child''s pose', 'Duduk bersimpuh, bungkukkan tubuh ke depan dengan tangan menjulur ke depan. Tahan 30 detik.', 10, 20, '["maintain"]', '["matras"]'),
('Tree pose', 'Berdiri dengan satu kaki, letakkan telapak kaki lainnya di paha dalam. Jaga keseimbangan.', 10, 30, '["maintain"]', '[]'),

-- HIIT circuits (lose_weight/maintain)
('Burpees', 'Dari posisi berdiri, jongkok, letakkan tangan di lantai, lompat kaki ke belakang, push-up, lompat kembali berdiri, dan lompat ke atas.', 15, 150, '["lose_weight"]', '[]'),
('Mountain climbers', 'Posisi plank, tarik lutut bergantian ke arah dada dengan cepat seperti mendaki gunung.', 10, 100, '["lose_weight", "maintain"]', '[]'),
('Jump squat', 'Lakukan squat biasa, lalu lompat ke atas saat berdiri. Mendarat dengan lembut dan ulangi.', 10, 120, '["lose_weight"]', '[]'),
('High plank to down dog', 'Dari posisi plank tinggi, angkat pinggul ke atas membentuk posisi downward dog, lalu kembali plank.', 10, 70, '["lose_weight", "maintain"]', '["matras"]'),

-- Core focused (maintain/gain_weight)
('Crunches', 'Berbaring telentang, tekuk lutut, angkat bahu dari lantai dengan mengencangkan perut.', 10, 40, '["maintain", "gain_weight"]', '["matras"]'),
('Bicycle crunches', 'Berbaring telentang, angkat kaki, putar tubuh menyentuh siku ke lutut bergantian seperti mengayuh sepeda.', 10, 60, '["lose_weight", "maintain", "gain_weight"]', '["matras"]'),
('Russian twist', 'Duduk dengan lutut ditekuk, angkat kaki sedikit dari lantai, putar tubuh ke kiri dan kanan sambil memegang tangan.', 10, 70, '["maintain", "gain_weight"]', '[]'),
('Leg raises', 'Berbaring telentang, angkat kedua kaki lurus ke atas hingga 90 derajat, lalu turunkan perlahan.', 10, 50, '["maintain", "gain_weight"]', '["matras"]'),
('Side plank', 'Tahan posisi menyamping dengan bertumpu pada satu lengan bawah. Jaga tubuh tetap lurus.', 10, 45, '["maintain", "gain_weight"]', '["matras"]'),

-- Additional balanced activities
('Jalan santai pagi', 'Berjalan santai di pagi hari selama 30 menit. Baik untuk kesehatan jantung dan relaksasi.', 30, 120, '["lose_weight", "maintain"]', '[]'),
('Senam lantai dasar', 'Rangkaian gerakan senam dasar: rolling, handstand wall-assist, dan bridge. Cocok untuk semua level.', 25, 150, '["maintain", "gain_weight"]', '["matras"]'),
('Latihan pernapasan', 'Latihan pernapasan dalam: tarik napas 4 detik, tahan 4 detik, hembuskan 6 detik. Ulangi 10 kali.', 10, 20, '["maintain"]', '[]'),
('Stretching seluruh tubuh', 'Peregangan menyeluruh dari kepala hingga kaki. Tahan tiap peregangan 20-30 detik.', 20, 50, '["maintain"]', '[]'),
('Latihan keseimbangan satu kaki', 'Berdiri dengan satu kaki, tahan 30 detik, ganti kaki. Tingkatkan durasi secara bertahap.', 10, 30, '["maintain"]', '[]'),
('Shadow boxing', 'Tinju bayangan di tempat: jab, cross, hook, uppercut. Gerakan cepat dengan jeda istirahat.', 15, 130, '["lose_weight", "maintain"]', '[]');

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
