const express = require('express');
const router = express.Router();
const { getLeaderboard, submitAnswer } = require('../services/triviaService');

/**
 * @route GET /trivia/leaderboard/:matchId
 * @desc Retrieve live trivia leaderboard score aggregates
 */
router.get('/leaderboard/:matchId', (req, res) => {
  try {
    const { matchId } = req.params;
    const scores = getLeaderboard(matchId);
    res.status(200).json({ leaderboard: scores });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /trivia/answer
 * @desc Validate a fan trivia answer submission
 */
router.post('/answer', (req, res) => {
  try {
    const { matchId, username, questionId, selectedIndex } = req.body;
    if (!matchId || !username || !questionId || selectedIndex === undefined) {
      return res.status(400).json({ error: "matchId, username, questionId, and selectedIndex are required." });
    }

    const result = submitAnswer({ matchId, username, questionId, selectedIndex });
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
