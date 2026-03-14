import 'dotenv/config';
import { Client } from 'pg';

const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || '5432';
const DB_NAME = process.env.DB_NAME || 'debtox';

async function createDatabaseIfNotExists() {
  // Connect to default 'postgres' database
  const client = new Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: parseInt(DB_PORT),
    database: 'postgres', // Connect to default database first
  });

  try {
    console.log(`🔐 Connecting to PostgreSQL at ${DB_HOST}:${DB_PORT}...`);
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const result = await client.query(
      `SELECT datname FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    );

    if (result.rows.length === 0) {
      console.log(`📦 Creating database '${DB_NAME}'...`);
      await client.query(`CREATE DATABASE "${DB_NAME}"`);
      console.log(`✅ Database '${DB_NAME}' created successfully`);
    } else {
      console.log(`✅ Database '${DB_NAME}' already exists`);
    }

    await client.end();
    console.log('✅ Setup complete');
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    throw error;
  }
}

export default createDatabaseIfNotExists;
