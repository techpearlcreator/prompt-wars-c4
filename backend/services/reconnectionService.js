const fs = require('fs');
const path = require('path');

const RECONNECTION_FILE = path.join(__dirname, '../data/reconnection.json');

/**
 * Reads database from file.
 */
function readDb() {
  try {
    if (!fs.existsSync(RECONNECTION_FILE)) return {};
    const raw = fs.readFileSync(RECONNECTION_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading reconnection file:", err);
    return {};
  }
}

/**
 * Writes to database file.
 */
function writeDb(data) {
  try {
    fs.writeFileSync(RECONNECTION_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to reconnection file:", err);
  }
}

/**
 * Returns reconnection list containing lost & found categories.
 */
function getReconnectionLogs(matchId) {
  const db = readDb();
  return db[matchId] || { lost: [], found: [] };
}

/**
 * Logs a found person reported by stewards.
 */
function logFoundPerson({ matchId, name, description, location }) {
  const db = readDb();
  if (!db[matchId]) {
    db[matchId] = { lost: [], found: [] };
  }

  const newFound = {
    id: `fnd_${Date.now()}`,
    name: name || "Unknown",
    description: description || "",
    location: location || "Guest Services Lobby",
    timestamp: new Date().toISOString(),
    status: "searching"
  };

  db[matchId].found.unshift(newFound);
  writeDb(db);

  console.log(`[Safety Dispatch] Found person logged: ${name} at ${location}`);
  return newFound;
}

/**
 * Logs a lost person report filed by a spectator.
 */
function logLostCompanion({ matchId, name, description, section }) {
  const db = readDb();
  if (!db[matchId]) {
    db[matchId] = { lost: [], found: [] };
  }

  const newLost = {
    id: `lst_${Date.now()}`,
    name: name || "Unknown",
    description: description || "",
    section: section || "Unknown",
    timestamp: new Date().toISOString(),
    status: "searching"
  };

  db[matchId].lost.unshift(newLost);
  writeDb(db);

  console.log(`[Safety Dispatch] Lost report logged: ${name} in Section ${section}`);
  return newLost;
}

/**
 * Scans the found companion lists for matches using simple token matching heuristics.
 */
function searchFoundPerson(matchId, queryText) {
  const db = readDb();
  const matchData = db[matchId];
  if (!matchData || !matchData.found || matchData.found.length === 0) return null;

  const cleanQuery = queryText.toLowerCase();

  // 1. Scan for matching names or descriptions
  for (let foundItem of matchData.found) {
    const cleanName = foundItem.name.toLowerCase();
    
    // Check if name is mentioned, or description matches keywords like shirt color
    const hasNameMatch = cleanName !== "unknown" && cleanQuery.includes(cleanName);
    
    // Split descriptions to match keywords like "red", "yellow"
    const descriptionTokens = foundItem.description.toLowerCase().replace(/[,.]/g, "").split(/\s+/);
    const hasDescMatch = descriptionTokens.some(token => token.length > 3 && cleanQuery.includes(token));

    if (hasNameMatch || hasDescMatch) {
      // Mark as matched in DB
      foundItem.status = "matched";
      writeDb(db);
      return foundItem;
    }
  }

  return null;
}

module.exports = {
  getReconnectionLogs,
  logFoundPerson,
  logLostCompanion,
  searchFoundPerson
};
