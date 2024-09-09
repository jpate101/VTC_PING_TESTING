const express = require('express');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
const querystring = require('querystring'); 

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

  let modifiedUrl = req.url.substring(5);

  const ampIndex = modifiedUrl.indexOf('&');
  if (ampIndex !== -1) {
    modifiedUrl = modifiedUrl.substring(0, ampIndex);
  }


  logger.info({
    type: '/GPS',
    body: req.body,
    imei: modifiedUrl
  });

  // Do not send any response
});

/*app.post('/gps', (req, res) => {
  // Extract IMEI from query parameters (default to 'Unknown' if not present)

  // Log raw text data for debugging
  console.log('Received raw data:', req.body);

  // Split the raw data into individual NMEA sentences
  const sentences = req.body.split('\n').filter(sentence => sentence.trim().startsWith('$'));
  let imei = 'Unknown'
  let time = 'Unknown';
  let latitude = 'Unknown';
  let longitude = 'Unknown';
  let altitude = 'Unknown';

  sentences.forEach(sentence => {
    const parts = sentence.split(',');
    const type = sentence.substring(1, 6); // Extract the sentence type, e.g., 'GPGGA'

    switch (type) {
      case 'GPGGA': // Global Positioning System Fix Data
        time = parts[1];
        latitude = convertToDecimal(parts[2], parts[3]);
        longitude = convertToDecimal(parts[4], parts[5]);
        altitude = parts[9];
        break;
      case 'GNGNS': // GNSS Fix Data (similar to GPGGA)
        time = parts[1];
        latitude = convertToDecimal(parts[2], parts[3]);
        longitude = convertToDecimal(parts[4], parts[5]);
        altitude = parts[9];
        break;
      // Add more cases for other sentence types if needed
    }
  });

  // Check if all required values are present
  if (time !== 'Unknown' && latitude !== 'Unknown' && longitude !== 'Unknown' && altitude !== 'Unknown') {
    const gpsLogEntry = {
      imei: imei, // Extracted from query parameters
      time: time,
      latitude: latitude,
      longitude: longitude,
      altitude: altitude,
      timestamp: new Date().toISOString()
    };

    // Log entry using Winston
    logger.info({
      message: 'GPS Data received',
      data: gpsLogEntry
    });

    // Send a response indicating success
    res.status(200).send('GPS data received and logged');
  } else {
    // If required values are missing, log an error and send a bad request response
    logger.error({
      message: 'Incomplete GPS data received',
      body: req.body
    });

    res.status(400).send('Missing required GPS data');
  }
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
*/
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
