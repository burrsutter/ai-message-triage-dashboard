# AI Message Triage Dashboard

A Node.js application that monitors the AI Message Triage Kafka pipeline and
republishes messages to a browser over a WebSocket connection. It supports both
the original localhost workflow and deployment in the `message-triage`
OpenShift project.

## Features

- Connects to Kafka and subscribes to configurable topics
- Streams messages in real-time to a browser via WebSocket
- Displays messages in a clean, organized dashboard
- Labels `cleared` and `ready` as **guardian cleared** and **customer ready**
  while retaining their original Kafka topic identifiers
- Allows clearing messages for individual topics or all at once
- Clears browser-local message cards after the dashboard server is replaced by
  a demo reset, while preserving cards across ordinary reconnects to the same
  server process
- Includes a Kafka simulator for testing without a real Kafka cluster

## Prerequisites

- Node.js 20 or higher
- npm 10 or higher
- Kafka cluster (optional - a simulator is included for testing)

## Installation

1. Clone the repository or download the source code
2. Install dependencies:

```bash
npm install
```

## Configuration

The application uses environment variables for configuration. Copy
`.env.example` to `.env`, or keep using the original checked-in `.env` file.
`KAFKA_TOPICS` is preferred, while `TOPIC_1` through `TOPIC_10` remain supported
for backward compatibility.

```
# Server Configuration
PORT=3000

# Kafka Configuration
KAFKA_BROKER=localhost:9092
KAFKA_CLIENT_ID=message-triage-dashboard
KAFKA_CONSUMER_GROUP_ID=message-triage-dashboard-group

# Kafka Topics
KAFKA_TOPICS=intake,structured,cleared,ready,support,finance,website,outflow,review,sales
```

To connect to a different Kafka broker or change the topic names, update the
environment. No code changes are required.

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

## OpenShift deployment

The deployment uses the existing Kafka broker in the `message-triage` project:

```text
message-triage-kafka-kafka-bootstrap.message-triage.svc:9092
```

Prerequisites:

- `oc` is logged in to the target cluster.
- The active user can create builds, deployments, services, and routes in
  `message-triage`.
- The `message-triage-kafka` Kafka resource is ready.

Build and deploy the dashboard source from this public GitHub repository:

```bash
./openshift/deploy.sh
```

The script scopes every namespaced `oc` operation explicitly to
`message-triage`; it does not change your active OpenShift project.

The script creates a Git-backed Docker build, deploys one dashboard replica,
waits for readiness, and prints the HTTPS route. WebSocket traffic uses the same
TLS route as the browser application. The build defaults to the `main` branch;
set `DASHBOARD_GIT_REF` to build another pushed branch, tag, or commit:

```bash
DASHBOARD_GIT_REF=v1.0.0 ./openshift/deploy.sh
```

Because OpenShift clones the repository, local uncommitted changes are not part
of the image.

Inspect it with:

```bash
oc get build,pods,service,route -n message-triage \
  -l app.kubernetes.io/name=message-triage-dashboard
oc logs deployment/message-triage-dashboard -n message-triage
```

Remove only the dashboard resources with:

```bash
./openshift/uninstall.sh
```

The uninstall script does not remove Kafka, topics, model configuration, or the
`message-triage` project.

### Accessing the dashboard

Open your browser and navigate to:

```
http://localhost:3000
```

## How it works

1. The server connects to Kafka and subscribes to the configured topics
2. When a message is received from any topic, it's forwarded to all connected WebSocket clients
3. The browser client displays messages in separate panels for each topic
4. Messages include timestamps and are displayed in chronological order

The server exposes `/healthz` for liveness, `/readyz` for Kafka-aware readiness,
and `/api/status` for operational diagnostics.

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
