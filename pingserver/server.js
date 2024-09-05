const express = require('express');
const fs = require('fs');
const path = require('path');

const net = require('net');

const app = express();
const port = 3000;
const logFile = path.join(__dirname, 'ping_log.txt');

// Middleware to parse JSON bodies
app.use(express.json());

app.get('/ping', (req, res) => {
  const timestamp = new Date().toISOString();
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const logEntry = `${timestamp} - Ping received from IP: ${ip}\n`;

  // Append log entry to file
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log file', err);
      res.status(500).send('Server error');
      return;
    }
  });

  res.status(200).send('Ping received');
});

app.post('/gps', (req, res) => {
  const timestamp = new Date().toISOString();
  const gpsData = req.body; // Expecting GPS data to be sent in the request body

  // Log the entire request body for detailed inspection
  const logEntry = `${timestamp} - Received GPS Data: ${JSON.stringify(gpsData)}\n`;

  // Append log entry to file
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log file', err);
      res.status(500).send('Server error');
      return;
    }
  });

  res.status(200).send('GPS data received');
});

app.post('/', (req, res) => {
  const timestamp = new Date().toISOString();
  const gpsData = req.body; // Expecting GPS data to be sent in the request body

  // Log the entire request body for detailed inspection
  const logEntry = `${timestamp} - Received GPS Data: ${JSON.stringify(gpsData)}\n`;

  // Append log entry to file
  fs.appendFile(logFile, logEntry, (err) => {
    if (err) {
      console.error('Failed to write to log file', err);
      res.status(500).send('Server error');
      return;
    }
  });

  res.status(200).send('GPS data received');
});

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