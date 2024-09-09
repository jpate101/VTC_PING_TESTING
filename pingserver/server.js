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

/*app.post('/gps', (req, res) => {
  logger.info({
    message: 'Raw GPS request received',
    headers: req.headers,
    body: req.body,
    method: req.method,
    url: req.url
  });

  // Do not send any response
});*/

// Middleware to parse raw text data
app.use(express.text({ type: 'application/vnd.teltonika.nmea' }));

// Function to parse $GPGSV sentence
function parseGPGSV(sentence) {
  const parts = sentence.split(',');

  if (parts[0] !== '$GPGSV') return null;

  const satellitesInView = parts[3];
  const satelliteDetails = parts.slice(4).map((_, index) => {
    if (index % 4 === 0) {
      return {
        prn: parts[index + 1],
        elevation: parts[index + 2],
        azimuth: parts[index + 3],
        snr: parts[index + 4]
      };
    }
  }).filter(Boolean);

  return { satellitesInView, satelliteDetails };
}

// Function to parse $GPGGA sentence
function parseGPGGA(sentence) {
  const parts = sentence.split(',');

  if (parts[0] !== '$GPGGA') return null;

  return {
    latitude: parseFloat(parts[2]) * (parts[3] === 'N' ? 1 : -1),
    longitude: parseFloat(parts[4]) * (parts[5] === 'E' ? 1 : -1),
    altitude: parseFloat(parts[9])
  };
}

// Function to parse $GPRMC sentence
function parseGPRMC(sentence) {
  const parts = sentence.split(',');

  if (parts[0] !== '$GPRMC') return null;

  return {
    latitude: parseFloat(parts[3]) * (parts[4] === 'N' ? 1 : -1),
    longitude: parseFloat(parts[5]) * (parts[6] === 'E' ? 1 : -1),
    speed: parseFloat(parts[7]),
    course: parseFloat(parts[8])
  };
}

app.post('/gps', (req, res) => {
  const gpsData = req.body;

  // Split the data into lines
  const lines = gpsData.split('\n');

  // Filter and parse sentences
  const gpgsvLines = lines.filter(line => line.startsWith('$GPGSV'));
  const gpggaLines = lines.filter(line => line.startsWith('$GPGGA'));
  const gprmcLines = lines.filter(line => line.startsWith('$GPRMC'));

  const parsedGPGSVData = gpgsvLines.map(parseGPGSV);
  const parsedGPGGAData = gpggaLines.map(parseGPGGA);
  const parsedGPRMCData = gprmcLines.map(parseGPRMC);

  // Log each parsed $GPGSV data
  parsedGPGSVData.forEach(data => {
    if (data) {
      logger.info({
        message: 'GPGSV Data',
        satellitesInView: data.satellitesInView,
        satelliteDetails: data.satelliteDetails
      });
    }
  });

  // Log each parsed $GPGGA data
  parsedGPGGAData.forEach(data => {
    if (data) {
      logger.info({
        message: 'GPGGA Data',
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude
      });
    }
  });

  // Log each parsed $GPRMC data
  parsedGPRMCData.forEach(data => {
    if (data) {
      logger.info({
        message: 'GPRMC Data',
        latitude: data.latitude,
        longitude: data.longitude,
        speed: data.speed,
        course: data.course
      });
    }
  });

  // Do not send any response
  // res.status(200).send('GPS data received'); // Comment out or remove this line
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
