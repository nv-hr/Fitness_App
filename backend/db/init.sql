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

-- ============================================================
-- Phase 06 Migration: Indonesian foods → International ingredients
-- Strategy: TRUNCATE foods table, reseed with international ingredients
-- Existing food_logs: food_id becomes NULL (ON DELETE SET NULL FK)
-- Existing food_logs: calories values preserved (stored as INT, not FK-dependent)
-- ============================================================

-- foods table: single table for seeded + custom foods (D-30)
-- Seeded foods: user_id=NULL, is_custom=FALSE
-- Custom foods: user_id=set, is_custom=TRUE
CREATE TABLE IF NOT EXISTS foods (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(255) NOT NULL,
  calories_per_100g INT NOT NULL,
  category ENUM('proteins', 'carbs', 'vegetables', 'fruits', 'dairy', 'fats', 'drinks', 'other') NOT NULL,
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
  meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, log_date),
  INDEX idx_user_recent (user_id, log_date DESC),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- Phase 08 Migration: meal_type ENUM from Indonesian to English
-- Order: UPDATE existing data first, then ALTER ENUM (D-20)
-- Mapping: sarapan→breakfast, makan_siang→lunch, makan_malam→dinner, camilan→snack
-- ============================================================

-- Step 1: Expand ENUM to include both old and new values
ALTER TABLE food_logs MODIFY COLUMN meal_type ENUM('sarapan', 'makan_siang', 'makan_malam', 'camilan', 'breakfast', 'lunch', 'dinner', 'snack') NOT NULL;

-- Step 2: Migrate existing rows from Indonesian to English
UPDATE food_logs SET meal_type = 'breakfast' WHERE meal_type = 'sarapan';
UPDATE food_logs SET meal_type = 'lunch' WHERE meal_type = 'makan_siang';
UPDATE food_logs SET meal_type = 'dinner' WHERE meal_type = 'makan_malam';
UPDATE food_logs SET meal_type = 'snack' WHERE meal_type = 'camilan';

-- Step 3: Remove Indonesian values from ENUM definition
ALTER TABLE food_logs MODIFY COLUMN meal_type ENUM('breakfast', 'lunch', 'dinner', 'snack') NOT NULL;

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
-- Seed Data: 210+ International Ingredients (Phase 06)
-- All seeded foods: is_custom=FALSE (0), user_id=NULL
-- Calorie values: USDA-based estimates per 100g, rounded to nearest integer
-- ============================================================

-- proteins (35 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Chicken breast, raw, skinless', 165, 'proteins', FALSE),
(NULL, 'Chicken thigh, raw, skinless', 177, 'proteins', FALSE),
(NULL, 'Chicken drumstick, raw, skinless', 172, 'proteins', FALSE),
(NULL, 'Chicken wing, raw, skinless', 188, 'proteins', FALSE),
(NULL, 'Ground beef, 80% lean', 254, 'proteins', FALSE),
(NULL, 'Ground beef, 93% lean', 176, 'proteins', FALSE),
(NULL, 'Beef sirloin steak, raw', 183, 'proteins', FALSE),
(NULL, 'Beef ribeye steak, raw', 291, 'proteins', FALSE),
(NULL, 'Pork tenderloin, raw', 143, 'proteins', FALSE),
(NULL, 'Pork chop, raw, boneless', 206, 'proteins', FALSE),
(NULL, 'Bacon, raw', 541, 'proteins', FALSE),
(NULL, 'Ham, sliced, deli', 145, 'proteins', FALSE),
(NULL, 'Salmon fillet, raw', 208, 'proteins', FALSE),
(NULL, 'Tuna, raw, yellowfin', 109, 'proteins', FALSE),
(NULL, 'Tuna, canned in water', 116, 'proteins', FALSE),
(NULL, 'Cod fillet, raw', 82, 'proteins', FALSE),
(NULL, 'Shrimp, raw, peeled', 99, 'proteins', FALSE),
(NULL, 'Tilapia fillet, raw', 96, 'proteins', FALSE),
(NULL, 'Sardines, canned in oil', 208, 'proteins', FALSE),
(NULL, 'Mackerel fillet, raw', 205, 'proteins', FALSE),
(NULL, 'Whole egg, raw', 143, 'proteins', FALSE),
(NULL, 'Egg white, raw', 52, 'proteins', FALSE),
(NULL, 'Tofu, firm', 144, 'proteins', FALSE),
(NULL, 'Tofu, silken', 55, 'proteins', FALSE),
(NULL, 'Tempeh', 193, 'proteins', FALSE),
(NULL, 'Black beans, cooked', 132, 'proteins', FALSE),
(NULL, 'Chickpeas, cooked', 164, 'proteins', FALSE),
(NULL, 'Lentils, cooked', 116, 'proteins', FALSE),
(NULL, 'Kidney beans, cooked', 127, 'proteins', FALSE),
(NULL, 'Edamame, cooked', 122, 'proteins', FALSE),
(NULL, 'Turkey breast, raw, skinless', 135, 'proteins', FALSE),
(NULL, 'Lamb leg, raw', 206, 'proteins', FALSE),
(NULL, 'Duck breast, raw, skinless', 132, 'proteins', FALSE),
(NULL, 'Venison, raw', 158, 'proteins', FALSE),
(NULL, 'Anchovies, canned in oil', 210, 'proteins', FALSE),
(NULL, 'Protein powder, whey isolate', 370, 'proteins', FALSE),
(NULL, 'Boneless skinless chicken thighs, raw', 209, 'proteins', FALSE),
(NULL, 'Beef brisket, raw', 217, 'proteins', FALSE);

-- carbs (30 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'White rice, cooked', 130, 'carbs', FALSE),
(NULL, 'Brown rice, cooked', 112, 'carbs', FALSE),
(NULL, 'Jasmine rice, cooked', 129, 'carbs', FALSE),
(NULL, 'Basmati rice, cooked', 121, 'carbs', FALSE),
(NULL, 'Whole wheat bread', 247, 'carbs', FALSE),
(NULL, 'White bread', 266, 'carbs', FALSE),
(NULL, 'Sourdough bread', 289, 'carbs', FALSE),
(NULL, 'Rye bread', 259, 'carbs', FALSE),
(NULL, 'Oats, rolled, dry', 389, 'carbs', FALSE),
(NULL, 'Quinoa, cooked', 120, 'carbs', FALSE),
(NULL, 'Sweet potato, baked', 90, 'carbs', FALSE),
(NULL, 'Potato, boiled, with skin', 87, 'carbs', FALSE),
(NULL, 'Pasta, spaghetti, cooked', 131, 'carbs', FALSE),
(NULL, 'Pasta, penne, cooked', 131, 'carbs', FALSE),
(NULL, 'Corn kernels, cooked', 96, 'carbs', FALSE),
(NULL, 'Barley, cooked', 123, 'carbs', FALSE),
(NULL, 'Couscous, cooked', 112, 'carbs', FALSE),
(NULL, 'Buckwheat, cooked', 92, 'carbs', FALSE),
(NULL, 'Millet, cooked', 119, 'carbs', FALSE),
(NULL, 'Tortilla, flour', 304, 'carbs', FALSE),
(NULL, 'Tortilla, corn', 218, 'carbs', FALSE),
(NULL, 'Bagel, plain', 257, 'carbs', FALSE),
(NULL, 'English muffin', 237, 'carbs', FALSE),
(NULL, 'Pita bread, white', 275, 'carbs', FALSE),
(NULL, 'Crackers, whole wheat', 427, 'carbs', FALSE),
(NULL, 'Pretzels', 381, 'carbs', FALSE),
(NULL, 'Noodles, egg, cooked', 138, 'carbs', FALSE),
(NULL, 'Rice noodles, cooked', 108, 'carbs', FALSE),
(NULL, 'Polenta, cooked', 70, 'carbs', FALSE),
(NULL, 'Farro, cooked', 120, 'carbs', FALSE);

-- vegetables (30 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Broccoli, raw', 34, 'vegetables', FALSE),
(NULL, 'Spinach, raw', 23, 'vegetables', FALSE),
(NULL, 'Carrot, raw', 41, 'vegetables', FALSE),
(NULL, 'Bell pepper, red, raw', 31, 'vegetables', FALSE),
(NULL, 'Bell pepper, green, raw', 20, 'vegetables', FALSE),
(NULL, 'Tomato, raw', 18, 'vegetables', FALSE),
(NULL, 'Cucumber, raw, with peel', 15, 'vegetables', FALSE),
(NULL, 'Onion, raw, yellow', 40, 'vegetables', FALSE),
(NULL, 'Zucchini, raw', 17, 'vegetables', FALSE),
(NULL, 'Cauliflower, raw', 25, 'vegetables', FALSE),
(NULL, 'Kale, raw', 49, 'vegetables', FALSE),
(NULL, 'Lettuce, iceberg', 14, 'vegetables', FALSE),
(NULL, 'Lettuce, romaine', 17, 'vegetables', FALSE),
(NULL, 'Mushroom, white, raw', 22, 'vegetables', FALSE),
(NULL, 'Mushroom, portobello, raw', 22, 'vegetables', FALSE),
(NULL, 'Green beans, raw', 31, 'vegetables', FALSE),
(NULL, 'Asparagus, raw', 20, 'vegetables', FALSE),
(NULL, 'Celery, raw', 14, 'vegetables', FALSE),
(NULL, 'Cabbage, raw, green', 25, 'vegetables', FALSE),
(NULL, 'Brussels sprouts, raw', 43, 'vegetables', FALSE),
(NULL, 'Eggplant, raw', 25, 'vegetables', FALSE),
(NULL, 'Garlic, raw', 149, 'vegetables', FALSE),
(NULL, 'Ginger, raw', 80, 'vegetables', FALSE),
(NULL, 'Radish, raw', 16, 'vegetables', FALSE),
(NULL, 'Beetroot, raw', 43, 'vegetables', FALSE),
(NULL, 'Sweet corn, raw', 86, 'vegetables', FALSE),
(NULL, 'Peas, green, raw', 81, 'vegetables', FALSE),
(NULL, 'Artichoke, raw', 47, 'vegetables', FALSE),
(NULL, 'Leek, raw', 61, 'vegetables', FALSE),
(NULL, 'Arugula, raw', 25, 'vegetables', FALSE),
(NULL, 'Bok choy, raw', 13, 'vegetables', FALSE),
(NULL, 'Okra, raw', 33, 'vegetables', FALSE),
(NULL, 'Shallot, raw', 72, 'vegetables', FALSE);

-- fruits (25 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Apple, raw, with skin', 52, 'fruits', FALSE),
(NULL, 'Banana, raw', 89, 'fruits', FALSE),
(NULL, 'Orange, raw', 47, 'fruits', FALSE),
(NULL, 'Strawberry, raw', 32, 'fruits', FALSE),
(NULL, 'Blueberry, raw', 57, 'fruits', FALSE),
(NULL, 'Mango, raw', 60, 'fruits', FALSE),
(NULL, 'Grape, red or green, raw', 69, 'fruits', FALSE),
(NULL, 'Watermelon, raw', 30, 'fruits', FALSE),
(NULL, 'Pineapple, raw', 50, 'fruits', FALSE),
(NULL, 'Peach, raw', 39, 'fruits', FALSE),
(NULL, 'Pear, raw, with skin', 57, 'fruits', FALSE),
(NULL, 'Kiwi, raw', 61, 'fruits', FALSE),
(NULL, 'Raspberry, raw', 52, 'fruits', FALSE),
(NULL, 'Blackberry, raw', 43, 'fruits', FALSE),
(NULL, 'Cherry, sweet, raw', 50, 'fruits', FALSE),
(NULL, 'Plum, raw', 46, 'fruits', FALSE),
(NULL, 'Avocado, raw', 160, 'fruits', FALSE),
(NULL, 'Grapefruit, raw', 42, 'fruits', FALSE),
(NULL, 'Pomegranate, raw', 83, 'fruits', FALSE),
(NULL, 'Papaya, raw', 43, 'fruits', FALSE),
(NULL, 'Cantaloupe melon, raw', 34, 'fruits', FALSE),
(NULL, 'Honeydew melon, raw', 36, 'fruits', FALSE),
(NULL, 'Coconut meat, raw', 354, 'fruits', FALSE),
(NULL, 'Fig, raw', 74, 'fruits', FALSE),
(NULL, 'Lemon, raw, without peel', 29, 'fruits', FALSE),
(NULL, 'Lime, raw', 30, 'fruits', FALSE),
(NULL, 'Cranberry, raw', 46, 'fruits', FALSE);

-- dairy (20 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Whole milk', 61, 'dairy', FALSE),
(NULL, 'Skim milk, fat-free', 34, 'dairy', FALSE),
(NULL, 'Cheddar cheese', 403, 'dairy', FALSE),
(NULL, 'Greek yogurt, plain, nonfat', 59, 'dairy', FALSE),
(NULL, 'Greek yogurt, plain, whole milk', 97, 'dairy', FALSE),
(NULL, 'Mozzarella cheese, part skim', 254, 'dairy', FALSE),
(NULL, 'Butter, salted', 717, 'dairy', FALSE),
(NULL, 'Cream cheese', 342, 'dairy', FALSE),
(NULL, 'Cottage cheese, low-fat 2%', 84, 'dairy', FALSE),
(NULL, 'Parmesan cheese, grated', 431, 'dairy', FALSE),
(NULL, 'Heavy cream', 340, 'dairy', FALSE),
(NULL, 'Sour cream', 193, 'dairy', FALSE),
(NULL, 'Ricotta cheese, part skim', 138, 'dairy', FALSE),
(NULL, 'Swiss cheese', 380, 'dairy', FALSE),
(NULL, 'Feta cheese', 264, 'dairy', FALSE),
(NULL, 'Goat cheese, soft', 364, 'dairy', FALSE),
(NULL, 'Yogurt, plain, whole milk', 61, 'dairy', FALSE),
(NULL, 'Yogurt, vanilla, low-fat', 91, 'dairy', FALSE),
(NULL, 'Buttermilk, low-fat', 40, 'dairy', FALSE),
(NULL, 'Gouda cheese', 356, 'dairy', FALSE);

-- fats (15 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Olive oil, extra virgin', 884, 'fats', FALSE),
(NULL, 'Coconut oil', 862, 'fats', FALSE),
(NULL, 'Almond butter', 614, 'fats', FALSE),
(NULL, 'Peanut butter, smooth', 588, 'fats', FALSE),
(NULL, 'Avocado oil', 884, 'fats', FALSE),
(NULL, 'Sunflower seeds, dried', 584, 'fats', FALSE),
(NULL, 'Walnuts, raw', 654, 'fats', FALSE),
(NULL, 'Chia seeds, dried', 486, 'fats', FALSE),
(NULL, 'Flaxseed, whole', 534, 'fats', FALSE),
(NULL, 'Sesame oil', 884, 'fats', FALSE),
(NULL, 'Cashews, raw', 553, 'fats', FALSE),
(NULL, 'Almonds, raw', 579, 'fats', FALSE),
(NULL, 'Pumpkin seeds, dried', 559, 'fats', FALSE),
(NULL, 'Peanuts, raw', 567, 'fats', FALSE),
(NULL, 'Hazelnuts, raw', 628, 'fats', FALSE);

-- drinks (15 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Orange juice, fresh', 45, 'drinks', FALSE),
(NULL, 'Apple juice, unsweetened', 46, 'drinks', FALSE),
(NULL, 'Black coffee, brewed', 2, 'drinks', FALSE),
(NULL, 'Green tea, brewed', 1, 'drinks', FALSE),
(NULL, 'Coca-Cola, regular', 42, 'drinks', FALSE),
(NULL, 'Almond milk, unsweetened', 15, 'drinks', FALSE),
(NULL, 'Soy milk, unsweetened', 33, 'drinks', FALSE),
(NULL, 'Coconut water', 19, 'drinks', FALSE),
(NULL, 'Sports drink, regular', 25, 'drinks', FALSE),
(NULL, 'Cranberry juice, unsweetened', 46, 'drinks', FALSE),
(NULL, 'Tomato juice, canned', 17, 'drinks', FALSE),
(NULL, 'Lemonade, prepared', 41, 'drinks', FALSE),
(NULL, 'Iced tea, sweetened', 35, 'drinks', FALSE),
(NULL, 'Energy drink, regular', 45, 'drinks', FALSE),
(NULL, 'Sparkling water, flavored', 4, 'drinks', FALSE);

-- other (20 items)
INSERT INTO foods (user_id, name, calories_per_100g, category, is_custom) VALUES
(NULL, 'Honey', 304, 'other', FALSE),
(NULL, 'Sugar, white granulated', 387, 'other', FALSE),
(NULL, 'Salt, table', 0, 'other', FALSE),
(NULL, 'Black pepper, ground', 251, 'other', FALSE),
(NULL, 'Soy sauce', 53, 'other', FALSE),
(NULL, 'Ketchup', 112, 'other', FALSE),
(NULL, 'Mayonnaise, regular', 680, 'other', FALSE),
(NULL, 'Mustard, yellow', 60, 'other', FALSE),
(NULL, 'Vinegar, white distilled', 18, 'other', FALSE),
(NULL, 'Dark chocolate, 70% cacao', 598, 'other', FALSE),
(NULL, 'Milk chocolate', 535, 'other', FALSE),
(NULL, 'Maple syrup', 260, 'other', FALSE),
(NULL, 'Balsamic vinegar', 88, 'other', FALSE),
(NULL, 'Hot sauce', 12, 'other', FALSE),
(NULL, 'BBQ sauce', 172, 'other', FALSE),
(NULL, 'Salsa, tomato', 36, 'other', FALSE),
(NULL, 'Brown sugar', 380, 'other', FALSE),
(NULL, 'Stevia, powdered', 0, 'other', FALSE),
(NULL, 'Worcestershire sauce', 78, 'other', FALSE),
(NULL, 'Ranch dressing', 443, 'other', FALSE),
(NULL, 'Olive tapenade', 250, 'other', FALSE),
(NULL, 'Pesto sauce, basil', 417, 'other', FALSE),
(NULL, 'Hummus', 166, 'other', FALSE);
