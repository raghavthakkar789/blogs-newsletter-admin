/**
 * Quick diagnostic script to test database connection and API endpoints
 * Run with: npx tsx scripts/test-connection.ts
 */

import dotenv from 'dotenv';
import { Pool } from 'pg';
import axios from 'axios';

dotenv.config({ path: '.env' });

async function testDatabase() {
  console.log('🔍 Testing Database Connection...\n');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    return false;
  }
  
  console.log(`📝 DATABASE_URL: ${databaseUrl.substring(0, 30)}...`);
  
  try {
    const pool = new Pool({ connectionString: databaseUrl });
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log(`   Server time: ${result.rows[0].now}\n`);
    await pool.end();
    return true;
  } catch (error: any) {
    console.error('❌ Database connection failed:');
    console.error(`   ${error.message}\n`);
    return false;
  }
}

async function testAPI() {
  console.log('🔍 Testing API Endpoints...\n');
  
  const baseURL = process.env.API_URL || 'http://localhost:5000';
  const adminToken = process.env.ADMIN_TOKEN || 'admin-token';
  
  try {
    // Test health endpoint
    console.log('1. Testing /api/health...');
    const healthResponse = await axios.get(`${baseURL}/api/health`);
    console.log(`   ✅ Health check: ${JSON.stringify(healthResponse.data)}\n`);
    
    // Test authenticated endpoint
    console.log('2. Testing /api/analytics/dashboard (authenticated)...');
    const analyticsResponse = await axios.get(`${baseURL}/api/analytics/dashboard`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    console.log(`   ✅ Analytics endpoint working!\n`);
    
    return true;
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Server is not running!');
      console.error('   Start the server with: npm run dev\n');
    } else if (error.response?.status === 401) {
      console.error('❌ Authentication failed!');
      console.error(`   Check ADMIN_TOKEN in .env file\n`);
    } else {
      console.error('❌ API test failed:');
      console.error(`   ${error.message}\n`);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Backend Connection Diagnostic Tool\n');
  console.log('=' .repeat(50) + '\n');
  
  const dbOk = await testDatabase();
  const apiOk = await testAPI();
  
  console.log('=' .repeat(50));
  console.log('\n📊 Summary:');
  console.log(`   Database: ${dbOk ? '✅ OK' : '❌ FAILED'}`);
  console.log(`   API: ${apiOk ? '✅ OK' : '❌ FAILED'}`);
  
  if (dbOk && apiOk) {
    console.log('\n🎉 All tests passed!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above.');
  }
}

main().catch(console.error);

