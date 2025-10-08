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
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Increase body parser limit for avatar uploads (base64 encoded images)
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use(requestLogger);

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