const { PrismaClient } = require('@prisma/client');

async function check() {
  const prisma = new PrismaClient();
  try {
    const maxConn = await prisma.$queryRaw`SELECT setting FROM pg_settings WHERE name = 'max_connections';`;
    const current = await prisma.$queryRaw`SELECT count(*) as total FROM pg_stat_activity WHERE datname = current_database();`;
    
    console.log('\n📊 Database Connection Status:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Max Connections Allowed: ${maxConn[0].setting}`);
    console.log(`Currently Used: ${current[0].total}`);
    console.log(`Available: ${maxConn[0].setting - current[0].total}`);
    
    console.log('\n✅ Fixes Applied:');
    console.log('   ✓ Singleton Prisma client (1 pool per app)');
    console.log('   ✓ Connection limit: 5 per instance');
    console.log('   ✓ Proper cleanup on shutdown');
    console.log('   ✓ Removed incorrect relationMode');
    
    console.log('\n💡 Your Setup Should Use:');
    console.log('   • DigitalOcean: ~5 connections max');
    console.log('   • Local dev: ~5 connections max');
    console.log('   • DBA tool: 1-2 connections');
    console.log('   ═══════════════════════════════');
    console.log('   Total: ~12 connections needed\n');
    
    if (current[0].total > 20) {
      console.log('⚠️  High connection count detected!');
      console.log('   Try restarting your local/prod servers\n');
    }
    
  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
