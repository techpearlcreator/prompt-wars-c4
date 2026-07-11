const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure database directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(SESSIONS_FILE)) {
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify({ sessions: {}, feedback: {} }, null, 2));
}

/**
 * Load all database content.
 */
function readDb() {
  try {
    const raw = fs.readFileSync(SESSIONS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading sessions database:", err);
    return { sessions: {}, feedback: {} };
  }
}

/**
 * Save all database content.
 */
function writeDb(data) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing sessions database:", err);
  }
}

/**
 * Save a single chat message to user history.
 */
function saveMessage(userId, text, sender, matchId) {
  const db = readDb();
  
  if (!db.sessions[userId]) {
    db.sessions[userId] = {
      messages: [],
      createdAt: Date.now(),
      matchId: matchId
    };
  }
  
  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const newMessage = {
    id: msgId,
    text,
    sender,
    timestamp: Date.now()
  };
  
  db.sessions[userId].messages.push(newMessage);
  db.sessions[userId].lastActivity = Date.now();
  db.sessions[userId].matchId = matchId; // Keep active match synced
  
  writeDb(db);
  return newMessage;
}

/**
 * Load chat history for a specific user.
 */
function loadSessionHistory(userId) {
  const db = readDb();
  if (db.sessions[userId]) {
    return db.sessions[userId].messages;
  }
  return [];
}

/**
 * Clear chat history.
 */
function clearSession(userId) {
  const db = readDb();
  if (db.sessions[userId]) {
    db.sessions[userId].messages = [];
    db.sessions[userId].lastActivity = Date.now();
    writeDb(db);
  }
}

/**
 * Save user satisfaction feedback (👍/👎).
 */
function saveFeedback(messageId, rating) {
  const db = readDb();
  db.feedback[messageId] = {
    rating: rating, // 'helpful' or 'not_helpful'
    timestamp: Date.now()
  };
  writeDb(db);
}

module.exports = {
  saveMessage,
  loadSessionHistory,
  clearSession,
  saveFeedback
};
