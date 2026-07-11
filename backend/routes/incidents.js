const express = require('express');
const router = express.Router();
const { getIncidents, logIncident } = require('../services/incidentService');

/**
 * @route GET /incidents/:matchId
 * @desc Get all incidents for a specific match
 */
router.get('/:matchId', (req, res) => {
  try {
    const { matchId } = req.params;
    const list = getIncidents(matchId);
    res.status(200).json({ incidents: list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /incidents
 * @desc Submit a new stadium safety incident report
 */
router.post('/', (req, res) => {
  try {
    const { matchId, type, section, details } = req.body;

    if (!matchId || !type || !details) {
      return res.status(400).json({ error: "matchId, type, and details are required." });
    }

    const incident = logIncident({ matchId, type, section, details });
    
    res.status(201).json({
      success: true,
      incident
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
