const express = require('express');
const router = express.Router();
const { getStreams, updateListeners } = require('../services/commentaryService');

/**
 * @route GET /commentary/:matchId
 * @desc Retrieve list of localized live commentary streams
 */
router.get('/:matchId', (req, res) => {
  try {
    const { matchId } = req.params;
    const streams = getStreams(matchId);
    res.status(200).json({ streams });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /commentary/listen
 * @desc Increment or decrement live listeners on a stream channel
 */
router.post('/listen', (req, res) => {
  try {
    const { matchId, streamId, action } = req.body;
    if (!matchId || !streamId || !action) {
      return res.status(400).json({ error: "matchId, streamId, and action (join|leave) are required." });
    }

    const result = updateListeners({ matchId, streamId, action });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
