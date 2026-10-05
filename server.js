require('dotenv').config();
const { Kafka } = require('kafkajs');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { randomUUID } = require('crypto');

const parseTopics = () => {
  if (process.env.KAFKA_TOPICS) {
    return process.env.KAFKA_TOPICS
      .split(',')
      .map((topic) => topic.trim())
      .filter(Boolean);
  }

  return Array.from(
    { length: 10 },
    (_, index) => process.env[`TOPIC_${index + 1}`] || `topic${index + 1}`,
  );
};

// Configuration from environment variables. Local defaults remain compatible
// with the original localhost demo; OpenShift injects overrides via ConfigMap.
const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID || 'message-triage-dashboard',
  brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
};

const topics = parseTopics();

// Initialize Kafka client
const kafka = new Kafka(kafkaConfig);
const consumer = kafka.consumer({ 
  groupId: process.env.KAFKA_CONSUMER_GROUP_ID || 'message-triage-dashboard-group' 
});
let kafkaConnected = false;
let shuttingDown = false;

consumer.on(consumer.events.CONNECT, () => {
  kafkaConnected = true;
  console.log(`Connected to Kafka at ${kafkaConfig.brokers.join(', ')}`);
});

consumer.on(consumer.events.DISCONNECT, () => {
  kafkaConnected = false;
  console.warn('Disconnected from Kafka');
});

consumer.on(consumer.events.CRASH, ({ payload }) => {
  kafkaConnected = false;
  console.error('Kafka consumer crashed:', payload.error);
});

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({
  server,
  maxPayload: 1024 * 1024,
  perMessageDeflate: false,
});
const dashboardSessionId = randomUUID();

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/readyz', (req, res) => {
  res.status(kafkaConnected ? 200 : 503).json({
    status: kafkaConnected ? 'ready' : 'waiting-for-kafka',
    kafkaConnected,
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    kafkaConnected,
    broker: kafkaConfig.brokers[0],
    topicCount: topics.length,
    resetAware: true,
  });
});

// API endpoint to get topic names
app.get('/api/topics', (req, res) => {
  res.json({ topics });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.send(JSON.stringify({
    type: 'session',
    sessionId: dashboardSessionId,
  }));
  
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

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// Connect to Kafka and subscribe to topics. KafkaJS handles reconnects after a
// successful connection; this loop handles Kafka being unavailable at startup.
const runConsumer = async () => {
  while (!shuttingDown) {
    try {
      await consumer.connect();

      for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: false });
      }

      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          console.log(`Received message from topic ${topic}`);
          broadcastMessage(topic, message.value);
        },
      });

      console.log(`Kafka consumer subscribed to: ${topics.join(', ')}`);
      return;
    } catch (error) {
      kafkaConnected = false;
      console.error('Error connecting to Kafka; retrying in 5 seconds:', error.message);
      await delay(5000);
    }
  }
};

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
  runConsumer().catch(console.error);
});

// Handle graceful shutdown
const gracefulShutdown = async () => {
  shuttingDown = true;
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
