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

app.post('/gps', (req, res) => {
  // Log the entire raw request body
  logger.info({ message: 'Raw GPS data received', data: req.body });

  // Do not send any response
  // res.status(200).send('GPS data received'); // Remove this line
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

// Function to delete logs older than 2 mins 
function cleanupOldLogs() {
  // Read the log file
  fs.readFile(logFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Failed to read log file', err);
      return;
    }

    // Parse log file data to JSON
    let logs;
    try {
      logs = data.trim().split('\n').map(line => JSON.parse(line));
    } catch (parseError) {
      console.error('Failed to parse log file', parseError);
      return;
    }

    // Get current time
    const now = new Date();

    // Filter out logs older than 2 minutes
    const filteredLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      const age = now - logTime;
      //return age <= 24 * 60 * 60 * 1000; // last day of data is kept
      return age <= 2 * 60 * 1000; // last day of data is kept
    });

    // Prepare the updated log data
    const updatedLogData = filteredLogs.map(log => JSON.stringify(log)).join('\n');

    // Append a newline indicating the cleanup operation
    const cleanupMetadata = `\n`;
    const finalLogData = updatedLogData + cleanupMetadata;

    // Write the filtered logs and metadata back to the file
    fs.writeFile(logFilePath, finalLogData, 'utf8', (writeErr) => {
      if (writeErr) {
        console.error('Failed to write log file', writeErr);
      }
    });
  });
}

// Schedule the cleanup function to run daily
//setInterval(cleanupOldLogs, 12 * 60 * 60 * 1000); // Every 12 hours
setInterval(cleanupOldLogs, 1 * 60 * 1000); // 

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});
