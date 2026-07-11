const express = require('express');
const router = express.Router();
const { getConcessionsData } = require('../services/commerceService');

/**
 * @route GET /concessions/:matchId
 * @desc Retrieve live queue sizes and wait times for concession facilities
 */
router.get('/:matchId', (req, res) => {
  try {
    const { matchId } = req.params;
    const data = getConcessionsData(matchId);
    res.status(200).json({ concessions: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
