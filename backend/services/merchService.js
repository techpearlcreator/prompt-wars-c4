const fs = require('fs');
const path = require('path');

const MERCH_FILE = path.join(__dirname, '../data/merch.json');

/**
 * Reads merch database from file.
 */
function readDb() {
  try {
    if (!fs.existsSync(MERCH_FILE)) return {};
    const raw = fs.readFileSync(MERCH_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading merch file:", err);
    return {};
  }
}

/**
 * Writes merch orders to file database.
 */
function writeDb(data) {
  try {
    fs.writeFileSync(MERCH_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to merch file:", err);
  }
}

/**
 * Returns all custom merch orders for a specific match.
 */
function getMerchOrders(matchId) {
  const db = readDb();
  return db[matchId] || [];
}

/**
 * Submits a new custom jersey printing task.
 */
function placeMerchOrder({ matchId, team, jerseyName, jerseyNumber, size }) {
  const db = readDb();
  if (!db[matchId]) {
    db[matchId] = [];
  }

  const orderId = `mch_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const cleanTeam = team || "Argentina";
  const cleanName = (jerseyName || "FAN").trim().toUpperCase();
  const cleanNumber = (jerseyNumber || "12").toString().trim();
  const cleanSize = (size || "L").toUpperCase();

  const newOrder = {
    id: orderId,
    team: cleanTeam,
    jerseyName: cleanName,
    jerseyNumber: cleanNumber,
    size: cleanSize,
    price: 120.00,
    status: 'printing',
    location: 'Apparel Locker (Section 108)',
    timestamp: new Date().toISOString()
  };

  db[matchId].unshift(newOrder); // Latest orders first
  writeDb(db);

  console.log(`[Stadium Commerce] Custom jersey order ${orderId} placed for print: ${cleanTeam} ${cleanName} #${cleanNumber}`);
  return newOrder;
}

module.exports = {
  getMerchOrders,
  placeMerchOrder
};
