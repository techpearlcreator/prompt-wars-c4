const { Server } = require('socket.io');

let io = null;

/**
 * Initializes the Socket.io connection.
 * @param {Object} server - HTTP Server instance.
 */
function initWebsocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // Allow all origins for dev testing
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`New Socket Client Connected: ${socket.id}`);

    // Allow user to join specific match rooms
    socket.on('join_match', (matchId) => {
      socket.join(matchId);
      console.log(`Client ${socket.id} joined room: ${matchId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Socket Client Disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Broadcasts an event to all users watching a specific match.
 * @param {string} matchId - The active match ID.
 * @param {Object} eventData - Details of the event (type, minute, description).
 */
function broadcastMatchEvent(matchId, eventData) {
  if (!io) {
    console.warn("Websocket server not initialized yet.");
    return;
  }
  
  console.log(`Broadcasting event to room ${matchId}:`, eventData);
  io.to(matchId).emit('match_event', eventData);
}

module.exports = {
  initWebsocket,
  broadcastMatchEvent
};
