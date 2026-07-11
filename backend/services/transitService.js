const fs = require('fs');
const path = require('path');

const TRANSIT_FILE = path.join(__dirname, '../data/transit.json');

/**
 * Reads transit database from file.
 */
function readDb() {
  try {
    if (!fs.existsSync(TRANSIT_FILE)) return {};
    const raw = fs.readFileSync(TRANSIT_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading transit file:", err);
    return {};
  }
}

/**
 * Returns transit data for a specific match.
 */
function getTransitMetrics(matchId) {
  const db = readDb();
  return db[matchId] || null;
}

module.exports = {
  getTransitMetrics
};
