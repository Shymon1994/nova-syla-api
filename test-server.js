const express = require('express');
const app = express();

app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

const server = app.listen(3001, () => {
  console.log('Test server running on http://localhost:3001');
});

console.log('Server started, waiting for connections...');

// Prevent immediate shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
