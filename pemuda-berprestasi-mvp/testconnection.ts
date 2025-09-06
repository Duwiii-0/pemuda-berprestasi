// src/scripts/testDrizzleConnection.ts - FIXED VERSION
import { db, connection } from '../config/drizzle';
import { tbAkun } from '../db/schema/index';
import { eq } from 'drizzle-orm';

async function testDrizzleConnection() {
  console.log('🔧 Testing Drizzle ORM Connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing MySQL connection...');
    
    // Use execute instead of ping for connection pool
    await connection.execute('SELECT 1');
    console.log('✅ MySQL connection successful!\n');

    // Test 2: Test Drizzle schema
    console.log('2️⃣ Testing Drizzle schema...');
    const result = await db.select().from(tbAkun).limit(1);
    console.log('✅ Drizzle schema working!');
    console.log(`📊 Found ${result.length} records in tb_akun\n`);

    // Test 3: Test query with where clause
    console.log('3️⃣ Testing query with conditions...');
    const adminAccount = await db
      .select()
      .from(tbAkun)
      .where(eq(tbAkun.role, 'ADMIN'))
      .limit(1);
    
    console.log(`✅ Query successful! Found ${adminAccount.length} admin accounts\n`);

    // Test 4: Test insert (rollback)
    console.log('4️⃣ Testing insert operation...');
    const testEmail = `test_${Date.now()}@example.com`;
    
    // Insert test record
    const insertResult = await db.insert(tbAkun).values({
      email: testEmail,
      passwordHash: 'test_hash',
      role: 'ADMIN'
    });
    
    console.log('✅ Insert successful!');
    
    // Clean up - delete test record
    await db.delete(tbAkun).where(eq(tbAkun.email, testEmail));
    console.log('✅ Cleanup successful!\n');

    console.log('🎉 All Drizzle tests passed!');
    console.log('📋 Phase 1.4 & 1.5 completed successfully!');
    
    return true;
  } catch (error) {
    console.error('❌ Drizzle test failed:', error);
    
    // More detailed error information
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Troubleshooting info
    console.log('\n🔍 Troubleshooting:');
    console.log('1. Check DATABASE_URL in .env file');
    console.log('2. Ensure MySQL server is running');
    console.log('3. Verify database permissions');
    console.log('4. Check if tables exist in database');
    console.log('5. Ensure all schema files are properly exported');
    
    return false;
  } finally {
    // Close connection pool
    try {
      await connection.end();
      console.log('🔌 Connection pool closed');
    } catch (closeError) {
      console.error('Error closing connection:', closeError);
    }
  }
}

// Run test if called directly
if (require.main === module) {
  testDrizzleConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

export { testDrizzleConnection };