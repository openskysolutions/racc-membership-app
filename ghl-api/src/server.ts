// Register path mapping for absolute imports
require('tsconfig-paths/register');
require('dotenv').config();
import app from './app';
import { databaseService } from '@/services/database';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize database before starting server
async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...');
    await databaseService.initialize();
    console.log('Database initialized successfully');

    // Start server - bind to 0.0.0.0 to allow connections from local network
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running at:`);
      console.log(`  - Local:   http://localhost:${PORT}/api`);
      console.log(`  - Network: http://192.168.200.0:${PORT}/api`);
      console.log(`Swagger documentation available at http://localhost:${PORT}/api/docs`);
      console.log('Ready to accept registration requests');
      
      // Signal to PM2 that the app is ready (for zero-downtime deployments)
      if (process.send) {
        process.send('ready');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await databaseService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await databaseService.close();
  process.exit(0);
});

startServer();