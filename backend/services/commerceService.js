const fs = require('fs');
const path = require('path');

const CONCESSIONS_FILE = path.join(__dirname, '../data/stadiumConcessions.json');

/**
 * Reads all concessions database.
 */
function readDb() {
  try {
    if (!fs.existsSync(CONCESSIONS_FILE)) return {};
    const raw = fs.readFileSync(CONCESSIONS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading concessions file:", err);
    return {};
  }
}

/**
 * Return raw concessions array for a specific match.
 */
function getConcessionsData(matchId) {
  const db = readDb();
  const matchData = db[matchId] || db["fifa_2026_001"];
  return matchData ? matchData.concessions : [];
}

/**
 * Formats wait times and busy status for LLM prompt injection.
 */
function getQueueStatusSummary(matchId) {
  const data = getConcessionsData(matchId);
  if (data.length === 0) return "";

  const lines = data.map(item => 
    `- ${item.name} (${item.category.toUpperCase()}): Wait time is ${item.waitTime} minutes (Status: ${item.status.toUpperCase()})`
  ).join('\n');

  return `--- LIVE STADIUM QUEUE STATUS & WAIT TIMES ---
${lines}
---------------------------------------------`;
}

module.exports = {
  getConcessionsData,
  getQueueStatusSummary
};
