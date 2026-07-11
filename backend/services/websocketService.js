const { Server } = require('socket.io');

let io = null;

// In-memory cheer counters
const teamCheers = {
  fifa_2026_001: { home: 50, away: 30 },
  fifa_2026_002: { home: 45, away: 35 }
};

/**
 * Calculates percentage ratios for home/away cheers.
 */
function getCheerRatios(matchId) {
  const matchCheers = teamCheers[matchId] || { home: 50, away: 50 };
  const total = matchCheers.home + matchCheers.away;
  const homePercent = Math.round((matchCheers.home / total) * 100);
  const awayPercent = 100 - homePercent;
  return { homePercent, awayPercent };
}

/**
 * Initializes the Socket.io connection.
 * @param {Object} server - HTTP Server instance.
 */
function initWebsocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`New Socket Client Connected: ${socket.id}`);

    // Allow user to join specific match rooms
    socket.on('join_match', (matchId) => {
      socket.join(matchId);
      console.log(`Client ${socket.id} joined room: ${matchId}`);
      
      // Push initial cheer stats to this client
      socket.emit('cheer_update', getCheerRatios(matchId));
    });

    // Handle incoming cheer submissions
    socket.on('submit_cheer', ({ matchId, team }) => {
      if (!teamCheers[matchId]) {
        teamCheers[matchId] = { home: 10, away: 10 };
      }
      
      if (team === 'home' || team === 'away') {
        teamCheers[matchId][team] += 1;
        const ratios = getCheerRatios(matchId);
        
        console.log(`Cheer registered for ${matchId} [${team}]. New ratios:`, ratios);
        
        // Broadcast updated ratios to everyone in the match room
        io.to(matchId).emit('cheer_update', ratios);
      }
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
 */
function broadcastMatchEvent(matchId, eventData) {
  if (!io) {
    console.warn("Websocket server not initialized yet.");
    return;
  }
  
  console.log(`Broadcasting event to room ${matchId}:`, eventData);
  io.to(matchId).emit('match_event', eventData);
}

/**
 * Broadcasts a live match poll to all users in a match room.
 */
function broadcastMatchPoll(matchId, pollData) {
  if (!io) {
    console.warn("Websocket server not initialized yet.");
    return;
  }
  
  console.log(`Broadcasting poll to room ${matchId}:`, pollData);
  io.to(matchId).emit('match_poll', pollData);
}

module.exports = {
  initWebsocket,
  broadcastMatchEvent,
  broadcastMatchPoll
};
