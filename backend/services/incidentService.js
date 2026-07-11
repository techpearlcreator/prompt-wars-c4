const fs = require('fs');
const path = require('path');

const INCIDENTS_FILE = path.join(__dirname, '../data/incidents.json');

/**
 * Reads all incident logs from storage.
 */
function readDb() {
  try {
    if (!fs.existsSync(INCIDENTS_FILE)) return {};
    const raw = fs.readFileSync(INCIDENTS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading incidents file:", err);
    return {};
  }
}

/**
 * Writes incident logs to storage.
 */
function writeDb(data) {
  try {
    fs.writeFileSync(INCIDENTS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to incidents file:", err);
  }
}

/**
 * Returns incidents list for a specific match.
 */
function getIncidents(matchId) {
  const db = readDb();
  return db[matchId] || [];
}

/**
 * Logs a new reported safety incident.
 */
function logIncident({ matchId, type, section, details }) {
  const db = readDb();
  
  if (!db[matchId]) {
    db[matchId] = [];
  }

  const newIncident = {
    id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    type: type.toLowerCase(), // medical, security, hazard, lost_person
    section: section || "Unknown",
    details: details || "No details provided.",
    status: "open",
    timestamp: new Date().toISOString()
  };

  db[matchId].unshift(newIncident); // Prepend to show latest first
  writeDb(db);

  console.log(`[Safety Dispatch] Incident logged for ${matchId} Section ${section}: ${type} - ${details}`);
  return newIncident;
}

module.exports = {
  getIncidents,
  logIncident
};
