const express = require('express');
const router = express.Router();
const mockMatchContext = require('../mockMatchContext');
const { broadcastMatchEvent } = require('../services/websocketService');

/**
 * @route POST /admin/event
 * @desc Trigger a live match event (simulation endpoint for demo)
 */
router.post('/event', (req, res) => {
  try {
    const { matchId, type, team, player, description, minute } = req.body;

    if (!matchId || !type || !description) {
      return res.status(400).json({ error: "matchId, type, and description are required." });
    }

    const match = mockMatchContext[matchId];
    if (!match) {
      return res.status(404).json({ error: `Match ${matchId} not found.` });
    }

    const eventMinute = minute || match.liveData.minute;
    
    // 1. Create event object
    const newEvent = {
      minute: eventMinute,
      type: type.toUpperCase(), // GOAL, VAR_REVIEW, RED_CARD, SUBSTITUTION, etc.
      team,
      player,
      description
    };

    // 2. Append event to database
    match.recentEvents.unshift(newEvent); // Prepended so it shows at the top of lists

    // 3. Update score if goal
    if (type.toUpperCase() === 'GOAL') {
      if (team === 'home') {
        match.liveData.score.home += 1;
      } else if (team === 'away') {
        match.liveData.score.away += 1;
      }
    }

    // Update live minute
    match.liveData.minute = eventMinute;

    // 4. Emit event over websocket to all listening clients in match room
    broadcastMatchEvent(matchId, {
      ...newEvent,
      liveScore: match.liveData.score,
      liveMinute: eventMinute
    });

    console.log(`Live match event created for ${matchId}: ${type} - ${description}`);

    res.status(200).json({
      success: true,
      event: newEvent,
      score: match.liveData.score,
      minute: eventMinute
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
