const express = require('express');
const router = express.Router();
const { getOrders, placeOrder } = require('../services/orderService');

/**
 * @route GET /orders/:matchId
 * @desc Retrieve reported concessions orders for a match
 */
router.get('/:matchId', (req, res) => {
  try {
    const { matchId } = req.params;
    const list = getOrders(matchId);
    res.status(200).json({ orders: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /orders
 * @desc Place a food order at concessions
 */
router.post('/', (req, res) => {
  try {
    const { matchId, items, type, section } = req.body;

    if (!matchId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "matchId and items (array) are required." });
    }

    const order = placeOrder({ matchId, items, type, section });
    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
