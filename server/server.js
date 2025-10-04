import express from 'express';
import fs from 'fs';
import path from 'path';

// server logs can be found in ./logs/app.log (ensure this directory exists)
const app = express();
const PORT = 3000;

const logFilePath = path.resolve('./logs/app.log');

function logToFile(level, message) {
  const timestamp = new Date().toISOString(); 
  
  const formatted = `${timestamp.replace('T', ' ').replace('Z','')} ${level.toUpperCase()}  [com.example.MyService] - ${message}\n`;
  fs.appendFileSync(logFilePath, formatted);
}

app.use((req, res, next) => {
  logToFile('INFO', `Incoming ${req.method} request to ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  logToFile('INFO', 'Handled GET /');
  res.send('Hello from mock enterprise server!');
});

app.get('/error', (req, res) => {
  logToFile('ERROR', 'Database connection failed at com.example.DBConnector');
  res.status(500).send('Simulated server error');
});

// some random simulation
setInterval(() => {
  const rand = Math.random();
  if (rand < 0.2) {
    logToFile('WARN', 'High memory usage detected in com.example.CacheManager');
  } else {
    logToFile('INFO', 'Background task executed successfully');
  }
}, 5000);

app.listen(PORT, () => {
  logToFile('INFO', `Server started on port ${PORT}`);
  console.log(`Server running at http://localhost:${PORT}`);
});
