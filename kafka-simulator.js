/**
 * Kafka Simulator
 * 
 * This script simulates Kafka messages for testing the dashboard without a real Kafka cluster.
 * It connects to the Kafka client in the main server and produces random messages to the topics.
 */

require('dotenv').config();
const { Kafka } = require('kafkajs');

// Configuration from environment variables
const kafkaConfig = {
  clientId: process.env.KAFKA_CLIENT_ID ? `${process.env.KAFKA_CLIENT_ID}-simulator` : 'message-simulator',
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

// Sample message templates for different topics
const messageTemplates = {
  [process.env.TOPIC_1 || 'topic1']: ['User login successful', 'User logout', 'Password reset requested', 'Account created'],
  [process.env.TOPIC_2 || 'topic2']: ['Payment processed', 'Payment failed', 'Refund issued', 'Subscription renewed'],
  [process.env.TOPIC_3 || 'topic3']: ['Order placed', 'Order shipped', 'Order delivered', 'Order cancelled'],
  [process.env.TOPIC_4 || 'topic4']: ['Item added to cart', 'Item removed from cart', 'Cart checkout', 'Cart abandoned'],
  [process.env.TOPIC_5 || 'topic5']: ['API request received', 'API response sent', 'API rate limit exceeded', 'API key created'],
  [process.env.TOPIC_6 || 'topic6']: ['Database query executed', 'Database connection established', 'Database backup completed', 'Database error occurred'],
  [process.env.TOPIC_7 || 'topic7']: ['Email sent', 'Email opened', 'Email bounced', 'Email clicked'],
  [process.env.TOPIC_8 || 'topic8']: ['File uploaded', 'File downloaded', 'File deleted', 'File shared'],
  [process.env.TOPIC_9 || 'topic9']: ['System startup', 'System shutdown', 'System update', 'System error']
};

// Initialize Kafka client
const kafka = new Kafka(kafkaConfig);
const producer = kafka.producer();

// Function to generate a random message for a topic
function generateRandomMessage(topic) {
  const templates = messageTemplates[topic] || ['Generic message'];
  const randomIndex = Math.floor(Math.random() * templates.length);
  const baseMessage = templates[randomIndex];
  const id = Math.floor(Math.random() * 1000);
  return `${baseMessage} (ID: ${id})`;
}

// Function to send a random message to a random topic
async function sendRandomMessage() {
  const randomTopicIndex = Math.floor(Math.random() * topics.length);
  const topic = topics[randomTopicIndex];
  const message = generateRandomMessage(topic);
  
  try {
    await producer.send({
      topic,
      messages: [
        { value: message }
      ],
    });
    console.log(`Sent to ${topic}: ${message}`);
  } catch (error) {
    console.error(`Error sending message to ${topic}:`, error);
  }
}

// Main function
async function run() {
  try {
    // Connect to Kafka
    await producer.connect();
    console.log('Kafka simulator connected');
    
    // Send messages at random intervals
    setInterval(async () => {
      await sendRandomMessage();
    }, 1000 + Math.random() * 2000); // Random interval between 1-3 seconds
    
  } catch (error) {
    console.error('Error in Kafka simulator:', error);
  }
}

// Handle graceful shutdown
const gracefulShutdown = async () => {
  try {
    await producer.disconnect();
    console.log('Kafka simulator disconnected');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start the simulator
run().catch(console.error);
