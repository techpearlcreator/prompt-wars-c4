const express = require('express');
const router = express.Router();
const { getMerchOrders, placeMerchOrder } = require('../services/merchService');

/**
 * @route GET /merch/:matchId
 * @desc Retrieve custom merchandise orders for a match
 */
router.get('/:matchId', (req, res) => {
  try {
    const { matchId } = req.params;
    const list = getMerchOrders(matchId);
    res.status(200).json({ orders: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /merch
 * @desc Order a custom printed jersey
 */
router.post('/', (req, res) => {
  try {
    const { matchId, team, jerseyName, jerseyNumber, size } = req.body;

    if (!matchId || !team || !jerseyName || !jerseyNumber) {
      return res.status(400).json({ error: "matchId, team, jerseyName, and jerseyNumber are required." });
    }

    const order = placeMerchOrder({ matchId, team, jerseyName, jerseyNumber, size });
    res.status(201).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
