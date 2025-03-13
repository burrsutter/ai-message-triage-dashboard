require('dotenv').config();
const { Kafka } = require('kafkajs');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Configuration from environment variables
const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'message-triage-dashboard',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
};

const topics = [
  process.env.TOPIC_1 || 'topic1',
  process.env.TOPIC_2 || 'topic2',
  process.env.TOPIC_3 || 'topic3',
  process.env.TOPIC_4 || 'topic4',
  process.env.TOPIC_5 || 'topic5',
  process.env.TOPIC_6 || 'topic6',
  process.env.TOPIC_7 || 'topic7',
  process.env.TOPIC_8 || 'topic8',
  process.env.TOPIC_9 || 'topic9'
];

// Initialize Kafka client
const kafka = new Kafka(kafkaConfig);
const consumer = kafka.consumer({ 
  groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'message-triage-dashboard-group' 
});

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to get topic names
app.get('/api/topics', (req, res) => {
  res.json({ topics });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Function to broadcast messages to all connected clients
const broadcastMessage = (topic, message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        topic,
        message: message.toString(),
        timestamp: new Date().toISOString()
      }));
    }
  });
};

// Connect to Kafka and subscribe to topics
const runConsumer = async () => {
  try {
    await consumer.connect();
    
    // Subscribe to all topics
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }
    
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        console.log(`Received message from topic ${topic}: ${message.value.toString()}`);
        broadcastMessage(topic, message.value);
      },
    });
    
    console.log('Kafka consumer started');
  } catch (error) {
    console.error('Error connecting to Kafka:', error);
  }
};

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  runConsumer().catch(console.error);
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
  try {
    await consumer.disconnect();
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
