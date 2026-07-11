const express = require('express');
const router = express.Router();
const { getReconnectionLogs, logFoundPerson, logLostCompanion } = require('../services/reconnectionService');

/**
 * @route GET /reconnection/:matchId
 * @desc Get all lost and found logs for a specific match
 */
router.get('/:matchId', (req, res) => {
  try {
    const { matchId } = req.params;
    const logs = getReconnectionLogs(matchId);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /reconnection/lost
 * @desc Submit a lost person report
 */
router.post('/lost', (req, res) => {
  try {
    const { matchId, name, description, section } = req.body;
    if (!matchId || !name || !description) {
      return res.status(400).json({ error: "matchId, name, and description are required." });
    }

    const report = logLostCompanion({ matchId, name, description, section });
    res.status(201).json({ success: true, lost: report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /reconnection/found
 * @desc Log a found person reported by stewards
 */
router.post('/found', (req, res) => {
  try {
    const { matchId, name, description, location } = req.body;
    if (!matchId || !name || !description) {
      return res.status(400).json({ error: "matchId, name, and description are required." });
    }

    const report = logFoundPerson({ matchId, name, description, location });
    res.status(201).json({ success: true, found: report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
