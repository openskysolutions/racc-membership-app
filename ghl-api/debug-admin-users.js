/**
 * Debug admin users API call
 */
const { databaseService } = require('./dist/services/database');

async function debugAdminUsers() {
  try {
    // Initialize database
    await databaseService.initialize();
    
    console.log('🔍 Debugging admin users API...');
    console.log('='.repeat(50));
    
    // Test the getAllUsers method directly
    console.log('1. Testing getAllUsers directly:');
    const allUsers = await databaseService.getAllUsers(50, 0);
    console.log(`   - Total users returned: ${allUsers.length}`);
    
    if (allUsers.length > 0) {
      console.log('   - Sample user data:');
      const sampleUser = allUsers[0];
      console.log(`     ID: ${sampleUser.id}`);
      console.log(`     Email: ${sampleUser.email}`);
      console.log(`     Role: ${sampleUser.role}`);
      console.log(`     Status: ${sampleUser.status}`);
    }
    
    // Test filtering logic similar to admin API
    console.log('\n2. Testing filtering logic:');
    
    // Search filter test
    const searchTerm = '';
    let filteredUsers = allUsers;
    
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.firstName.toLowerCase().includes(searchTermLower) ||
        user.lastName.toLowerCase().includes(searchTermLower) ||
        user.email.toLowerCase().includes(searchTermLower) ||
        (user.businessName && user.businessName.toLowerCase().includes(searchTermLower))
      );
    }
    console.log(`   - After search filter: ${filteredUsers.length} users`);
    
    // Role filter test
    const role = ''; // empty = all roles
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    console.log(`   - After role filter: ${filteredUsers.length} users`);
    
    // Status filter test
    const status = ''; // empty = all statuses
    if (status) {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }
    console.log(`   - After status filter: ${filteredUsers.length} users`);
    
    // Remove password hashes
    const safeUsers = filteredUsers.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
    
    console.log('\n3. Final result:');
    console.log(`   - Final user count: ${safeUsers.length}`);
    
    if (safeUsers.length > 0) {
      console.log('   - Users list:');
      safeUsers.forEach((user, index) => {
        console.log(`     ${index + 1}. ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}/${user.status}`);
      });
    }
    
    // Close database
    await databaseService.close();
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

debugAdminUsers();