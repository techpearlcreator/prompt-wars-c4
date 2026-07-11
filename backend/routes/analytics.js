const express = require('express');
const router = express.Router();
const { getAnalyticsData } = require('../services/analyticsService');

/**
 * @route GET /analytics
 * @desc Retrieve stadium operational assistant metrics
 */
router.get('/', (req, res) => {
  try {
    const data = getAnalyticsData();
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
