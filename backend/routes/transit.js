const express = require('express');
const router = express.Router();
const { getTransitMetrics } = require('../services/transitService');

/**
 * @route GET /transit/:matchId
 * @desc Retrieve live rideshare wait times, pricing surge multipliers, and train schedules
 */
router.get('/:matchId', (req, res) => {
  try {
    const { matchId } = req.params;
    const stats = getTransitMetrics(matchId);
    if (!stats) {
      return res.status(404).json({ error: "No transit records found for match." });
    }
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
