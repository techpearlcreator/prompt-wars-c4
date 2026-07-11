const express = require('express');
const router = express.Router();
const mockMatchContext = require('../mockMatchContext');
const { broadcastMatchEvent, broadcastMatchPoll } = require('../services/websocketService');

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
    
    const newEvent = {
      minute: eventMinute,
      type: type.toUpperCase(),
      team,
      player,
      description
    };

    match.recentEvents.unshift(newEvent);

    if (type.toUpperCase() === 'GOAL') {
      if (team === 'home') {
        match.liveData.score.home += 1;
      } else if (team === 'away') {
        match.liveData.score.away += 1;
      }
    }

    match.liveData.minute = eventMinute;

    broadcastMatchEvent(matchId, {
      ...newEvent,
      liveScore: match.liveData.score,
      liveMinute: eventMinute
    });

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

/**
 * @route POST /admin/poll
 * @desc Push an interactive fan poll to the match chat feed
 */
router.post('/poll', (req, res) => {
  try {
    const { matchId, question, options } = req.body;

    if (!matchId || !question || !options || !Array.isArray(options)) {
      return res.status(400).json({ error: "matchId, question, and options (array) are required." });
    }

    const pollId = `poll_${Date.now()}`;
    const pollData = {
      id: pollId,
      question,
      options
    };

    // Broadcast poll to all fans watching this match
    broadcastMatchPoll(matchId, pollData);

    res.status(200).json({
      success: true,
      poll: pollData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
