const express = require('express');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const querystring = require('querystring'); 
const cors = require('cors');

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
app.use(cors()); // Enable CORS for all routes

app.post('/ping', (req, res) => {
  const timestamp = new Date().toISOString();
  const systemName = req.body.systemName || 'Unknown';
  const latitude = req.body.latitude || 'Unknown';
  const longitude = req.body.longitude || 'Unknown';
  const diskUsage = req.body.diskUsage || {};
  const webpageStatus = req.body.webpageStatus || {};
  const signalLevels = req.body.signalLevels|| {};
  //console.log(req.body)
  //console.log(signalLevels)
  const logEntry = {
    timestamp: timestamp,
    systemName: systemName,
    type: 'Ping',
    latitude: latitude,
    longitude: longitude,
    diskUsage: diskUsage,
    CameraAvailability: webpageStatus,
    signalLevels: signalLevels
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
  // Extract IMEI from the URL
  let modifiedUrl = req.url.substring(5);
  const ampIndex = modifiedUrl.indexOf('&');
  if (ampIndex !== -1) {
    modifiedUrl = modifiedUrl.substring(0, ampIndex);
  }
  modifiedUrl = modifiedUrl.substring(5);

  // Initialize variables
  let latitude = 'Unknown';
  let longitude = 'Unknown';
  let altitude = 'Unknown';

  // Split the body into sentences
  const sentences = req.body.split('\n').filter(sentence => sentence.trim().startsWith('$'));
  
  sentences.forEach(sentence => {
    const parts = sentence.split(',');
    const type = sentence.substring(1, 6); // Extract the sentence type, e.g., 'GPGGA'

    switch (type) {
      case 'GPGGA': // Global Positioning System Fix Data
        // Convert latitude
        const latDegrees = parseFloat(parts[2].substring(0, 2));
        const latMinutes = parseFloat(parts[2].substring(2));
        latitude = latDegrees + (latMinutes / 60);
        if (parts[3] === 'S') {
          latitude = -latitude;
        }

        // Convert longitude
        const lonDegrees = parseFloat(parts[4].substring(0, 3));
        const lonMinutes = parseFloat(parts[4].substring(3));
        longitude = lonDegrees + (lonMinutes / 60);
        if (parts[5] === 'W') {
          longitude = -longitude;
        }

        altitude = parseFloat(parts[9]);
        break;
    }
  });

  // Log the results
  logger.info({
    type: 'GPS',
    //body: req.body,
    imei: modifiedUrl,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    altitude: parseFloat(altitude)
  });

  // No response sent
});

// Convert latitude/longitude from NMEA format to decimal degrees
function convertToDecimal(value, direction) {
  if (value === 'Unknown' || direction === 'Unknown') return 'Unknown';
  
  const degrees = parseFloat(value.substring(0, 2));
  const minutes = parseFloat(value.substring(2));
  let decimal = degrees + (minutes / 60);
  
  // Apply sign based on direction (latitude and longitude signs are different)
  if (direction === 'S') {
    decimal = -decimal;
  }

  return decimal.toFixed(6); // Limit to 6 decimal places for precision
}

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
      return age <= 72 * 60 * 60 * 1000; // last day of data is kept
      //return age <= 2 * 60 * 60 * 1000; // last day of data is kept
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
setInterval(cleanupOldLogs, 12 * 60 * 60 * 1000); // Every 12 hours
//setInterval(cleanupOldLogs, 60 * 60 * 1000); // 

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}/`);
});
