const express = require('express');
const cors = require('cors');
// const { swaggerUi, swaggerSpec } = require('./swagger');
const indexRoutes = require('./routes/index');

const app = express();

app.use(cors());
app.use(express.json());

// Swagger docs
// app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api', indexRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

module.exports = app;