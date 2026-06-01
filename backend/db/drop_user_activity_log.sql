-- Cleanup: drop the old user_activity_log table
-- Data loss acceptable -- contained only seed/test data
-- Run BEFORE schema.sql to avoid FK conflicts during recreation

DROP TABLE IF EXISTS user_activity_log CASCADE;
