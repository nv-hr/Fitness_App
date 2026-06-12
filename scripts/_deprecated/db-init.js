import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("Please set DATABASE_URL environment variable.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const files = [
      'backend/db/drop_user_activity_log.sql',
      'backend/db/schema.sql',
      'backend/db/seed.sql'
    ];

    for (const file of files) {
      if (fs.existsSync(file)) {
        console.log(`Running ${file}...`);
        const sql = fs.readFileSync(file, 'utf8');
        await pool.query(sql);
        console.log(`Successfully executed ${file}`);
      } else {
        console.warn(`File not found: ${file}`);
      }
    }
    console.log("Database initialized successfully!");
  } catch (err) {
    console.error("Error setting up database:", err);
    process.exit(1);
  } finally {
    pool.end();
  }
}

run();
