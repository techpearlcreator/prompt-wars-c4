const fs = require('fs');
const path = require('path');

const ORDERS_FILE = path.join(__dirname, '../data/orders.json');

/**
 * Reads order database from file.
 */
function readDb() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return {};
    const raw = fs.readFileSync(ORDERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading orders file:", err);
    return {};
  }
}

/**
 * Writes orders to file database.
 */
function writeDb(data) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to orders file:", err);
  }
}

/**
 * Returns all orders for a specific match.
 */
function getOrders(matchId) {
  const db = readDb();
  return db[matchId] || [];
}

/**
 * Submits a new concession order.
 */
function placeOrder({ matchId, items, type, section }) {
  const db = readDb();
  if (!db[matchId]) {
    db[matchId] = [];
  }

  // Calculate order total
  let total = 0;
  const processedItems = items.map(item => {
    const qty = parseInt(item.qty) || 1;
    const price = parseFloat(item.price) || 6.00;
    total += qty * price;
    return { name: item.name, qty, price };
  });

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const eta = type === 'delivery' ? 12 : 5; // 12m for seat delivery, 5m for pickup counter

  const newOrder = {
    id: orderId,
    items: processedItems,
    total: parseFloat(total.toFixed(2)),
    type: type || 'pickup', // pickup or delivery
    section: section || 'Unknown',
    eta,
    status: 'preparing',
    timestamp: new Date().toISOString()
  };

  db[matchId].unshift(newOrder); // Latest orders first
  writeDb(db);

  console.log(`[Concession Commerce] Order ${orderId} placed for Section ${section}: Total $${total}`);
  return newOrder;
}

module.exports = {
  getOrders,
  placeOrder
};
