#!/usr/bin/env node

// Test script to verify database connection and table existence for SAGE project
import dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './src/lib/schema.js';
import { sql } from 'drizzle-orm';

console.log('Loading environment variables...');
dotenv.config({ path: './.env.local' });
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Create database connection - same as db.ts
const sqlConnection = neon(process.env.DATABASE_URL);
const db = drizzle(sqlConnection, { schema });

async function testConnection() {
  try {
    console.log('Testing database connection...');

    // Simple connection test - try to select from users table (should exist)
    const result = await db.select().from(schema.users).limit(0);
    console.log('✅ Database connection successful');

    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testTableExistence() {
  const tables = [
    'users',
    'subscriptions',
    'channels',
    'channel_subscriptions',
    'streams',
    'processing_queue',
    'rate_limits',
    'user_analytics'
  ];

  console.log('\nChecking table existence...');

  const missingTables = [];

  for (const table of tables) {
    try {
      await db.execute(sql`SELECT 1 FROM ${sql.identifier(table)} LIMIT 1`);
      console.log(`✅ Table '${table}' exists`);
    } catch (error) {
      console.log(`❌ Table '${table}' missing or error:`, error.message);
      missingTables.push(table);
    }
  }

  if (missingTables.length === 0) {
    console.log('\n✅ All tables exist in the database');
  } else {
    console.log('\n⚠️  Some tables are missing:', missingTables.join(', '));
  }

  return missingTables.length === 0;
}

async function runTests() {
  console.log('🔍 Starting database tests for SAGE project...\n');

  const connectionOk = await testConnection();
  const tablesOk = await testTableExistence();

  console.log('\n📊 Test Summary:');
  console.log('Connection Test:', connectionOk ? 'PASS' : 'FAIL');
  console.log('Table Existence Test:', tablesOk ? 'PASS' : 'FAIL');

  if (connectionOk && tablesOk) {
    console.log('\n🎉 All tests passed! Database is ready for SAGE.');
    process.exit(0);
  } else {
    console.log('\n💥 Some tests failed. Check the database configuration and schema deployment.');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('💥 Unexpected error during testing:', error);
  process.exit(1);
});
