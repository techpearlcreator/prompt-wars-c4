const fs = require('fs');
const path = require('path');

const COMMENTARY_FILE = path.join(__dirname, '../data/commentary.json');

/**
 * Reads commentary database from file.
 */
function readDb() {
  try {
    if (!fs.existsSync(COMMENTARY_FILE)) return {};
    const raw = fs.readFileSync(COMMENTARY_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading commentary file:", err);
    return {};
  }
}

/**
 * Writes to commentary database file.
 */
function writeDb(data) {
  try {
    fs.writeFileSync(COMMENTARY_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to commentary file:", err);
  }
}

/**
 * Returns available commentary streams for a match.
 */
function getStreams(matchId) {
  const db = readDb();
  const matchData = db[matchId] || { streams: [] };
  return matchData.streams || [];
}

/**
 * Updates listener counts when a fan joins/leaves an audio stream channel.
 */
function updateListeners({ matchId, streamId, action }) {
  const db = readDb();
  const matchData = db[matchId];
  if (!matchData) return { success: false, error: "Match not found" };

  const stream = matchData.streams.find(s => s.id === streamId);
  if (!stream) return { success: false, error: "Stream not found" };

  if (action === 'join') {
    stream.listeners += 1;
  } else if (action === 'leave') {
    stream.listeners = Math.max(0, stream.listeners - 1);
  }

  writeDb(db);

  return {
    success: true,
    listeners: stream.listeners
  };
}

module.exports = {
  getStreams,
  updateListeners
};
