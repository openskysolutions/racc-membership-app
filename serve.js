const express = require('express');
const path = require('path');

const app = express();
const port = process.env.FRONTEND_PORT || 3001;

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing by serving index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Frontend server running on port ${port}`);
});