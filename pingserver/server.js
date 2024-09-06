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

app.post('/gps', (req, res) => {
  const timestamp = new Date().toISOString();
  const gpsData = req.body; // Expecting GPS data to be sent in the request body
  const logEntry = { timestamp, message: `Received GPS Data: ${JSON.stringify(gpsData)}` };

  // Log entry using Winston
  logger.info(logEntry);

  res.status(200).send('GPS data received');
});

app.post('/', (req, res) => {
  const timestamp = new Date().toISOString();
  const gpsData = req.body; // Expecting GPS data to be sent in the request body
  const logEntry = { timestamp, message: `Received GPS Data: ${JSON.stringify(gpsData)}` };

  // Log entry using Winston
  logger.info(logEntry);

  res.status(200).send('GPS data received');
});

// Endpoint to get log data in JSON format
app.get('/logs', (req, res) => {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read log file', err);
      res.status(500).send('Server error');
      return;
    }
    
    try {
      // Parse log file data to JSON
      const logs = data.trim().split('\n').map(line => JSON.parse(line));
      res.json(logs);
    } catch (parseError) {
      console.error('Failed to parse log file', parseError);
      res.status(500).send('Error parsing log file');
    }
  });
});

// Function to delete logs older than 3 days
function cleanupOldLogs() {
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read log file for cleanup', err);
      return;
    }

    try {
      // Parse log file data to JSON
      const logs = data.trim().split('\n').map(line => JSON.parse(line));
      const cutoffDate = new Date();
      //cutoffDate.setDate(cutoffDate.getDate() - 3);
      //cutoffDate.setHours(cutoffDate.getHours() - 1); // Set cutoff date to 1 hour ago
      cutoffDate.setMinutes(cutoffDate.getMinutes() - 10);

      // Filter out logs older than 3 days
      const recentLogs = logs.filter(log => new Date(log.timestamp) > cutoffDate);

      // Write the filtered logs back to the file
      const newLogData = recentLogs.map(log => JSON.stringify(log)).join('\n');
      fs.writeFile(logFilePath, newLogData, 'utf8', (writeErr) => {
        if (writeErr) {
          console.error('Failed to write cleaned log file', writeErr);
        }
      });
    } catch (parseError) {
      console.error('Failed to parse log file for cleanup', parseError);
    }
  });
}

// Schedule the cleanup function to run daily
//setInterval(cleanupOldLogs, 24 * 60 * 60 * 1000); // Every 24 hours
setInterval(cleanupOldLogs, 10 * 60 * 1000); // Every 60 minutes

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});



//app.listen(port, '192.168.20.45', () => {
//    console.log(`Server running at http://192.168.20.45:${port}/`);
//  });


// TCP server
/*
const tcpServer = net.createServer((socket) => {
  const timestamp = new Date().toISOString();
  const remoteAddress = socket.remoteAddress;

  console.log(`${timestamp} - Connection from ${remoteAddress}`);
  const logEntry = `${timestamp} - Connection from ${remoteAddress}\n`;
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log file', err);
    }
  });

  socket.on('data', (data) => {
    const dataString = data.toString();
    console.log(`${timestamp} - Data received: ${dataString}`);
    const dataLogEntry = `${timestamp} - Data received: ${dataString}\n`;
    fs.appendFile(logFile, dataLogEntry, (err) => {
      if (err) {
        console.error('Failed to write to log file', err);
      }
    });
  });

  socket.on('end', () => {
    console.log(`${timestamp} - Connection ended`);
  });

  socket.on('error', (err) => {
    console.error('Connection error:', err.message);
  });
});

tcpServer.listen(port, '0.0.0.0', () => {
  console.log(`TCP server listening on port ${port}`);
});*/