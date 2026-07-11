const express = require('express');
const router = express.Router();
const { callClaudeAPI } = require('../services/claudeService');

/**
 * @route POST /chat
 * @desc Submit a message to the GenAI FIFA Stadium Assistant
 */
router.post('/', async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: "Message content is required." });
    }

    console.log(`Processing message: "${message}"`);
    const aiResponse = await callClaudeAPI(message);
    
    return res.status(200).json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
