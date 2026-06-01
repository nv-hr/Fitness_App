import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import app from './app.js';
import { pool } from './config/database.js';

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT} (NODE_ENV=${process.env.NODE_ENV})`);
  try {
    await pool.query('SELECT 1');
    console.log('Database connected');
  } catch (err) {
    console.error('Database connection failed:', err.message);
    console.error('Please configure DATABASE_URL in your Secrets panel.');
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  server.close(() => process.exit(1));
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  server.close(() => process.exit(1));
});

export default server;
