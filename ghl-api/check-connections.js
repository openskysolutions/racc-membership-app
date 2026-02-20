const { PrismaClient } = require('@prisma/client');

async function checkConnections() {
  const prisma = new PrismaClient();
  
  try {
    const result = await prisma.$queryRaw`
      SELECT 
        count(*) as connection_count,
        state,
        application_name
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state, application_name
      ORDER BY connection_count DESC;
    `;
    
    console.log('\n🔍 Current Database Connections:\n');
    console.table(result);
    
    const total = await prisma.$queryRaw`
      SELECT count(*) as total 
      FROM pg_stat_activity 
      WHERE datname = current_database();
    `;
    console.log(`\n📊 Total connections to database: ${total[0].total}\n`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnections();
