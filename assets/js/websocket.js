// ===== WEBSOCKET-LIKE LIVE FEED =====
// Simulates real-time updates using BroadcastChannel + storage fallback
// NO AUTO SIMULATION - all changes require user interaction

const WS_CHANNEL = 'onequeue-live-feed';
let wsChannel = null;
let wsListeners = [];
let wsConnected = false;

function initWebSocket() {
  try {
    wsChannel = new BroadcastChannel(WS_CHANNEL);
    wsChannel.onmessage = function(event) {
      const data = event.data;
      wsListeners.forEach(fn => {
        try { fn(data); } catch(e) {}
      });
    };
    wsConnected = true;
    console.log('[WS] BroadcastChannel connected');
  } catch (e) {
    console.log('[WS] BroadcastChannel not available, using fallback');
    wsConnected = false;
  }

  // Also listen to storage events for cross-tab communication fallback
  window.addEventListener('storage', function(e) {
    if (e.key === 'onequeue-event') {
      try {
        const data = JSON.parse(e.newValue);
        wsListeners.forEach(fn => {
          try { fn(data); } catch(err) {}
        });
      } catch(err) {}
    }
  });
}

function broadcastEvent(type, payload) {
  const event = { type, payload, timestamp: Date.now() };

  if (wsChannel && wsConnected) {
    wsChannel.postMessage(event);
  }

  // Fallback: use localStorage for cross-tab sync
  try {
    localStorage.setItem('onequeue-event', JSON.stringify(event));
    localStorage.setItem('onequeue-event-time', Date.now().toString());
  } catch(e) {}

  // Also notify same-tab listeners
  wsListeners.forEach(fn => {
    try { fn(event); } catch(e) {}
  });
}

function subscribeToEvents(callback) {
  wsListeners.push(callback);
  return function unsubscribe() {
    wsListeners = wsListeners.filter(fn => fn !== callback);
  };
}

// Initialize
if (typeof window !== 'undefined') {
  initWebSocket();
}
