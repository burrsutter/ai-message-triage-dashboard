# Kafka Message Triage Dashboard

A Node.js application that monitors 9 different Kafka topics and republishes those messages to a browser via a single WebSocket connection.

## Features

- Connects to Kafka and subscribes to 9 different topics
- Streams messages in real-time to a browser via WebSocket
- Displays messages in a clean, organized dashboard
- Allows clearing messages for individual topics or all at once
- Includes a Kafka simulator for testing without a real Kafka cluster

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Kafka cluster (optional - a simulator is included for testing)

## Installation

1. Clone the repository or download the source code
2. Install dependencies:

```bash
npm install
```

## Configuration

The application uses environment variables for configuration. These are stored in a `.env` file in the root directory. You can customize the following settings:

```
# Server Configuration
PORT=3000

# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=message-triage-dashboard
KAFKA_CONSUMER_GROUP_ID=message-triage-dashboard-group

# Kafka Topics
TOPIC_1=topic1
TOPIC_2=topic2
TOPIC_3=topic3
TOPIC_4=topic4
TOPIC_5=topic5
TOPIC_6=topic6
TOPIC_7=topic7
TOPIC_8=topic8
TOPIC_9=topic9
```

To connect to a different Kafka broker or change the topic names, simply update the values in the `.env` file. No code changes are required.

## Usage

### Running with a real Kafka cluster

If you have a Kafka cluster running, simply start the server:

```bash
npm start
```

### Running with the Kafka simulator

For testing without a real Kafka cluster, you can use the included simulator:

1. Start the server in one terminal:

```bash
npm start
```

2. Start the Kafka simulator in another terminal:

```bash
npm run simulator
```

3. Or run both simultaneously with:

```bash
npm run dev
```

### Accessing the dashboard

Open your browser and navigate to:

```
http://localhost:3000
```

## How it works

1. The server connects to Kafka and subscribes to the 9 topics
2. When a message is received from any topic, it's forwarded to all connected WebSocket clients
3. The browser client displays messages in separate panels for each topic
4. Messages include timestamps and are displayed in chronological order

## Troubleshooting

### Connection issues

If you're having trouble connecting to Kafka:

- Verify that your Kafka broker is running and accessible
- Check that the broker address in the `.env` file is correct
- Ensure that the topics exist in your Kafka cluster

### WebSocket issues

If the WebSocket connection is failing:

- Make sure the server is running
- Check that no firewall is blocking WebSocket connections
- Try refreshing the browser page

## License

MIT
