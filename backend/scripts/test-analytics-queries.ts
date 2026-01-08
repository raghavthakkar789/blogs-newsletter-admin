/**
 * Test script to verify analytics queries work correctly
 * Run with: npx tsx scripts/test-analytics-queries.ts
 * 
 * Note: Ensure DATABASE_URL is set in your environment or .env file
 */

// Load environment variables if dotenv is available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not available, rely on environment variables
}
import { getBlogStats, getNewsletterStats, findRecentActivityLogs } from '../src/db/queries';

async function testQueries() {
  console.log('Testing analytics queries...\n');

  try {
    console.log('1. Testing getBlogStats...');
    const blogStats = await getBlogStats();
    console.log('✅ Blog Stats:', blogStats);
  } catch (error: any) {
    console.error('❌ Error in getBlogStats:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    });
  }

  try {
    console.log('\n2. Testing getNewsletterStats...');
    const newsletterStats = await getNewsletterStats();
    console.log('✅ Newsletter Stats:', newsletterStats);
  } catch (error: any) {
    console.error('❌ Error in getNewsletterStats:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    });
  }

  try {
    console.log('\n3. Testing findRecentActivityLogs...');
    const activityLogs = await findRecentActivityLogs(10);
    console.log('✅ Activity Logs:', activityLogs.length, 'items');
    if (activityLogs.length > 0) {
      console.log('Sample:', activityLogs[0]);
    }
  } catch (error: any) {
    console.error('❌ Error in findRecentActivityLogs:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
    });
  }

  console.log('\n✅ All tests completed!');
  process.exit(0);
}

testQueries().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

