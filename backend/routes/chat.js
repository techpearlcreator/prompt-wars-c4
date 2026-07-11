const express = require('express');
const router = express.Router();
const { callClaudeAPI } = require('../services/claudeService');
const { saveMessage, saveFeedback, loadSessionHistory } = require('../services/sessionService');
const { analyzeSentiment } = require('../utils/sentimentAnalysis');

/**
 * @route POST /chat
 * @desc Submit a message to the GenAI FIFA Stadium Assistant
 */
router.post('/', async (req, res, next) => {
  try {
    const { message, userId = 'anonymous', matchId = 'fifa_2026_001', language = 'English' } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: "Message content is required." });
    }

    // 1. Analyze query sentiment
    const sentiment = analyzeSentiment(message);
    console.log(`User query sentiment: ${sentiment} for message: "${message}"`);

    // 2. Save user message to database
    saveMessage(userId, message, 'user', matchId);

    // 3. Call Claude API with matchId, language, and sentiment parameters
    const aiResponse = await callClaudeAPI(message, matchId, language, sentiment);
    
    // 4. Save AI response to database
    const savedAiMsg = saveMessage(userId, aiResponse, 'ai', matchId);

    return res.status(200).json({
      id: savedAiMsg.id,
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /chat/history/:userId
 * @desc Retrieve session chat history for a user
 */
router.get('/history/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const history = loadSessionHistory(userId);
    res.status(200).json({ history });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /chat/feedback
 * @desc Submit feedback rating for an AI response
 */
router.post('/feedback', (req, res) => {
  try {
    const { messageId, rating } = req.body;

    if (!messageId || !rating) {
      return res.status(400).json({ error: "messageId and rating are required." });
    }

    if (rating !== 'helpful' && rating !== 'not_helpful') {
      return res.status(400).json({ error: "Rating must be 'helpful' or 'not_helpful'." });
    }

    saveFeedback(messageId, rating);
    console.log(`Saved feedback rating '${rating}' for message '${messageId}'`);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
