document.addEventListener('DOMContentLoaded', async () => {
    // DOM elements
    const dashboard = document.getElementById('dashboard');
    const connectionStatus = document.getElementById('connection-status');
    const connectBtn = document.getElementById('connect-btn');
    const clearAllBtn = document.getElementById('clear-all-btn');
    
    // Fetch Kafka topics from server
    let topics = [];
    try {
        const response = await fetch('/api/topics');
        const data = await response.json();
        topics = data.topics;
    } catch (error) {
        console.error('Error fetching topics:', error);
        // Fallback to default topics if fetch fails
        topics = [
            'topic1', 'topic2', 'topic3', 'topic4', 'topic5',
            'topic6', 'topic7', 'topic8', 'topic9', 'topic10'
        ];
    }
    
    // WebSocket connection
    let socket = null;
    
    // Message counters for each topic
    const messageCounters = {};
    
    // Initialize the dashboard with topic panels
    function initializeDashboard() {
        topics.forEach(topic => {
            // Create topic panel
            const panel = document.createElement('div');
            panel.className = 'topic-panel';
            panel.id = `panel-${topic}`;
            
            // Create topic header
            const header = document.createElement('div');
            header.className = 'topic-header';
            
            // Create topic name
            const topicName = document.createElement('span');
            topicName.className = 'topic-name';
            topicName.textContent = topic;
            
            // Create message counter
            const counter = document.createElement('span');
            counter.className = 'message-count';
            counter.id = `counter-${topic}`;
            counter.textContent = '0';
            messageCounters[topic] = 0;
            
            // Create clear button
            const clearBtn = document.createElement('button');
            clearBtn.className = 'clear-btn';
            clearBtn.textContent = 'Clear';
            clearBtn.addEventListener('click', () => clearMessages(topic));
            
            // Assemble header
            header.appendChild(topicName);
            header.appendChild(counter);
            header.appendChild(clearBtn);
            
            // Create messages container
            const messagesContainer = document.createElement('div');
            messagesContainer.className = 'messages';
            messagesContainer.id = `messages-${topic}`;
            
            // Assemble panel
            panel.appendChild(header);
            panel.appendChild(messagesContainer);
            
            // Add panel to dashboard
            dashboard.appendChild(panel);
        });
    }
    
    // Connect to WebSocket server
    function connectWebSocket() {
        if (socket && socket.readyState !== WebSocket.CLOSED) {
            return; // Already connected
        }
        
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}`;
        
        socket = new WebSocket(wsUrl);
        
        socket.onopen = () => {
            connectionStatus.textContent = 'Connected';
            connectionStatus.className = 'connection-status connected';
            connectBtn.textContent = 'Disconnect';
        };
        
        socket.onclose = () => {
            connectionStatus.textContent = 'Disconnected';
            connectionStatus.className = 'connection-status disconnected';
            connectBtn.textContent = 'Connect';
            socket = null;
        };
        
        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            connectionStatus.textContent = 'Connection Error';
            connectionStatus.className = 'connection-status disconnected';
        };
        
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log(data.message)
                const jsonData = JSON.parse(data.message);
                console.log(jsonData.content)
                addMessage(data.topic, jsonData.content, data.timestamp);
            } catch (error) {
                console.error('Error parsing message:', error);
            }
        };
    }
    
    // Disconnect from WebSocket server
    function disconnectWebSocket() {
        if (socket) {
            socket.close();
        }
    }
    
    // Add a message to a topic panel
    function addMessage(topic, content, timestamp) {
        const messagesContainer = document.getElementById(`messages-${topic}`);
        if (!messagesContainer) return;
        
        // Create message element
        const messageElement = document.createElement('div');
        messageElement.className = 'message';
        
        // Add message content
        const contentElement = document.createElement('div');
        contentElement.textContent = content;
        messageElement.appendChild(contentElement);
        
        // Add timestamp
        const timeElement = document.createElement('div');
        timeElement.className = 'message-time';
        const date = new Date(timestamp);
        timeElement.textContent = date.toLocaleTimeString();
        messageElement.appendChild(timeElement);
        
        
        // Add message to container
        // messagesContainer.appendChild(messageElement);
        messagesContainer.prepend(messageElement);
        
        // Auto-scroll to bottom
        // messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Update counter
        messageCounters[topic]++;
        const counter = document.getElementById(`counter-${topic}`);
        if (counter) {
            counter.textContent = messageCounters[topic];
        }
    }
    
    // Clear messages for a specific topic
    function clearMessages(topic) {
        const messagesContainer = document.getElementById(`messages-${topic}`);
        if (messagesContainer) {
            messagesContainer.innerHTML = '';
            messageCounters[topic] = 0;
            const counter = document.getElementById(`counter-${topic}`);
            if (counter) {
                counter.textContent = '0';
            }
        }
    }
    
    // Clear all messages
    function clearAllMessages() {
        topics.forEach(topic => clearMessages(topic));
    }
    
    // Event listeners
    connectBtn.addEventListener('click', () => {
        if (socket && socket.readyState !== WebSocket.CLOSED) {
            disconnectWebSocket();
        } else {
            connectWebSocket();
        }
    });
    
    clearAllBtn.addEventListener('click', clearAllMessages);
    
    // Initialize the dashboard
    initializeDashboard();
    
    // Auto-connect on page load
    connectWebSocket();
});
