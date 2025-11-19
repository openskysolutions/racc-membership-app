import express from 'express';
import cors from 'cors';
import { swaggerUi, swaggerSpec } from '@/swagger';
import { requestLogger, errorLogger } from '@/middleware/logging';
import { errorHandler, notFoundHandler } from '@/middleware/errors';
import indexRoutes from '@/routes/index';

const app = express();

// Configure CORS to allow frontend access
app.use(cors({
  origin: [
    'https://members.richfieldareachamber.com',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3000',
    'http://localhost:3001',
    // Allow any local network IP for mobile development
    /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/,
    /^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/,
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}:\d+$/,
    // Capacitor apps (they use capacitor:// or ionic:// schemes)
    'capacitor://localhost',
    'ionic://localhost',
    'http://localhost',
    'https://localhost'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase body parser limit for uploads (base64 encoded images add ~33% overhead)
// So a 5MB image becomes ~6.6MB when base64 encoded
app.use(express.json({ limit: '15mb' }));

// Request logging middleware
app.use(requestLogger);

// Health check endpoint (before other routes, no auth required)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'racc-api'
  });
});

// Swagger docs
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api', indexRoutes);

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Error logging middleware
app.use(errorLogger);

// Main error handler
app.use(errorHandler);

export default app;