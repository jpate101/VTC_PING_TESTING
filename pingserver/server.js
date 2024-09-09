const express = require('express');
const path = require('path');
const fs = require('fs');
const winston = require('winston');

const app = express();
const port = 3000;
const logFilePath = path.join(__dirname, 'ping_log.txt');


// Set up Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    // Log to a file
    new winston.transports.File({ filename: logFilePath }),
    // Also log to the console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

// Middleware to parse JSON bodies
app.use(express.json());

app.post('/ping', (req, res) => {
  const timestamp = new Date().toISOString();
  const systemName = req.body.systemName || 'Unknown';
  const latitude = req.body.latitude || 'Unknown';
  const longitude = req.body.longitude || 'Unknown';
  const logEntry = {
    timestamp: timestamp,
    systemName: systemName,
    message: 'Ping received'
  };

  // Log entry using Winston
  logger.info(logEntry);

  res.status(200).send('Ping received');

  // Send only a status code with no body
  //res.sendStatus(204); // 204 No Content
});
// Middleware to parse raw text data
app.use(express.text({ type: 'application/vnd.teltonika.nmea' }));
app.post('/gps', (req, res) => {
  logger.info({
    message: 'Raw GPS request received',
    headers: req.headers,
    body: req.body,
    method: req.method,
    url: req.url
  });

  // Do not send any response
});



// Schedule the cleanup function to run daily
//setInterval(cleanupOldLogs, 12 * 60 * 60 * 1000); // Every 12 hours
setInterval(cleanupOldLogs, 1 * 60 * 1000); // 

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});
