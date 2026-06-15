## 1. Database Migration

- [x] 1.1 Execute the SQL to create the `activity_level` ENUM type if it's not already created: `CREATE TYPE activity_level AS ENUM ('sedentary', 'light', 'moderate', 'very_active', 'extra_active');`.
- [x] 1.2 Execute the SQL to add the column to the `profiles` table: `ALTER TABLE profiles ADD COLUMN activity_level activity_level;`.

## 2. API Documentation

- [x] 2.1 Update `backend/src/routes/docs.routes.js` to change the documented enum value from `active` to `very_active` for the `activityLevel` field.

## 3. Testing

- [x] 3.1 Test saving a new profile with various activity levels and confirm `activity_level` is stored in the database correctly.
- [x] 3.2 Test updating an existing profile with different activity levels and confirm it updates in the database successfully.
