#!/usr/bin/env node
/**
 * Schema verification script — confirms required tables and ENUMs exist
 * in the live database and the old user_activity_log table has been dropped.
 *
 * Usage:
 *   node backend/scripts/verify-schema.js
 *
 * Env vars:
 *   DATABASE_URL  — PostgreSQL connection string (required)
 *
 * Exit codes: 0 = pass, 1 = fail
 */

import pg from 'pg';

const { Pool } = pg;

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('FATAL: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('Verifying database schema...\n');

    // Query 1: List all public tables
    const tablesResult = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
    );
    const tables = tablesResult.rows.map(r => r.table_name);
    console.log('Tables found:', tables.join(', '));

    // Assert activity_logs exists
    const hasActivityLogs = tables.includes('activity_logs');
    console.log(`  activity_logs table: ${hasActivityLogs ? '✓ EXISTS' : '✗ MISSING'}`);

    // Assert weekly_plans exists
    const hasWeeklyPlans = tables.includes('weekly_plans');
    console.log(`  weekly_plans table: ${hasWeeklyPlans ? '✓ EXISTS' : '✗ MISSING'}`);

    // Assert user_activity_log does NOT exist
    const hasUserActivityLog = tables.includes('user_activity_log');
    console.log(`  user_activity_log table: ${!hasUserActivityLog ? '✓ DROPPED' : '✗ STILL EXISTS'}`);

    // Query 2: Check for all required ENUM types
    const enumNames = ['intensity_level', 'gender', 'fitness_goal', 'activity_level', 'food_category', 'meal_type'];
    const enumResult = await pool.query(
      `SELECT typname FROM pg_type WHERE typname = ANY($1)`,
      [enumNames]
    );
    const foundEnums = enumResult.rows.map(r => r.typname);
    let allEnumsPass = true;
    for (const name of enumNames) {
      const ok = foundEnums.includes(name);
      console.log(`  ${name} ENUM: ${ok ? '✓ EXISTS' : '✗ MISSING'}`);
      if (!ok) allEnumsPass = false;
    }

    // Query 3: Verify activity_logs columns
    if (hasActivityLogs) {
      const columnsResult = await pool.query(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns
         WHERE table_name = 'activity_logs' ORDER BY ordinal_position`
      );
      const columnNames = columnsResult.rows.map(r => r.column_name);
      console.log(`  activity_logs columns: ${columnNames.join(', ')}`);

      const requiredColumns = ['id', 'user_id', 'activity_id', 'duration_min', 'intensity', 'calories_burned', 'logged_date', 'created_at'];
      for (const col of requiredColumns) {
        if (!columnNames.includes(col)) {
          console.error(`  ✗ Missing required column: ${col}`);
          process.exit(1);
        }
      }
      console.log('  All required columns present');
    }

    // Query 4: Verify weekly_plans structure
    if (hasWeeklyPlans) {
      const wkResult = await pool.query(
        `SELECT column_name, data_type FROM information_schema.columns
         WHERE table_name = 'weekly_plans' ORDER BY ordinal_position`
      );
      const wkColumns = wkResult.rows.map(r => `${r.column_name} (${r.data_type})`);
      console.log(`  weekly_plans columns: ${wkColumns.join(', ')}`);
    }

    // Summary
    const allPass =
      hasActivityLogs &&
      hasWeeklyPlans &&
      !hasUserActivityLog &&
      allEnumsPass;

    console.log(allPass ? '\n✓ SCHEMA VERIFICATION PASSED' : '\n✗ SCHEMA VERIFICATION FAILED');
    process.exit(allPass ? 0 : 1);
  } catch (err) {
    console.error(`FATAL: ${err.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
