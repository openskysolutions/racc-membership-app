/**
 * Test admin authentication and role sync
 */
const { databaseService } = require('./dist/services/database');
const { ghlService } = require('./dist/services/gohighlevel');

async function testAdminAuth() {
  try {
    // Initialize services
    await databaseService.initialize();
    
    console.log('🔍 Testing admin authentication for schott@openskydev.com');
    console.log('='.repeat(60));
    
    // 1. Check current user in database
    const user = await databaseService.getUserByEmail('schott@openskydev.com');
    if (!user) {
      console.log('❌ User not found in database');
      return;
    }
    
    console.log('📋 Current database user:');
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Role: ${user.role}`);
    console.log(`  - Status: ${user.status}`);
    console.log(`  - GHL Contact ID: ${user.ghlContactId}`);
    
    // 2. Check HighLevel contact and tags
    console.log('\n🔍 Checking HighLevel contact...');
    try {
      const { isActive, contact } = await ghlService.isUserActive(user.email);
      console.log(`  - Is Active: ${isActive}`);
      console.log(`  - Contact Found: ${!!contact}`);
      
      if (contact) {
        console.log(`  - Contact ID: ${contact.id}`);
        console.log(`  - Contact Tags: ${JSON.stringify(contact.tags || [])}`);
        
        // Check for admin role
        const userRole = await ghlService.getUserRole(user.email);
        console.log(`  - Determined Role: ${userRole}`);
      }
    } catch (ghlError) {
      console.log(`  - HighLevel Error: ${ghlError.message}`);
    }
    
    // 3. Check sessions
    console.log('\n🔍 Checking active sessions...');
    const allUsers = await databaseService.getAllUsers(100, 0);
    const userSessions = allUsers.filter(u => u.email === user.email);
    console.log(`  - User records found: ${userSessions.length}`);
    
    // Close database
    await databaseService.close();
    
    console.log('\n💡 Next steps:');
    console.log('1. Make sure you have the "admin" tag in HighLevel contact tV0WwIdAlyvMLrd7mF7l');
    console.log('2. Login through the frontend to get a valid Bearer token');
    console.log('3. Check browser localStorage for "authToken"');
    console.log('4. Use that token in Authorization header: "Bearer <token>"');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testAdminAuth();