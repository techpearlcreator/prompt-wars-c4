const express = require('express');
const router = express.Router();
const { callClaudeAPI } = require('../services/claudeService');
const { saveMessage, saveFeedback, loadSessionHistory } = require('../services/sessionService');
const { analyzeSentiment } = require('../utils/sentimentAnalysis');
const { logIncident } = require('../services/incidentService');
const { placeOrder } = require('../services/orderService');

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

    // 2. Scan for safety keywords to auto-log incidents
    const emergencyKeywords = ['emergency', 'medical help', 'injured', 'lost child', 'fight', 'security help', 'fire', 'sos', 'heart attack', 'bleeding'];
    const lowerMessage = message.toLowerCase();
    const isEmergency = emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (isEmergency) {
      const sectionMatch = lowerMessage.match(/(?:sec|section)\s*(\d+)/i);
      const section = sectionMatch ? sectionMatch[1] : "Unknown";
      
      let type = "general_safety";
      if (lowerMessage.includes('medical') || lowerMessage.includes('injured') || lowerMessage.includes('heart') || lowerMessage.includes('bleeding')) {
        type = "medical";
      } else if (lowerMessage.includes('fight') || lowerMessage.includes('security') || lowerMessage.includes('stole')) {
        type = "security";
      } else if (lowerMessage.includes('child') || lowerMessage.includes('lost') || lowerMessage.includes('missing')) {
        type = "lost_person";
      } else if (lowerMessage.includes('fire') || lowerMessage.includes('hazard') || lowerMessage.includes('spill')) {
        type = "hazard";
      }

      logIncident({
        matchId,
        type,
        section,
        details: `Auto-logged via chat assistant: "${message}"`
      });
    }

    // 3. Scan for commerce keywords to auto-create food orders
    const buyKeywords = ['order', 'buy', 'purchase', 'get some', 'want a', 'want some'];
    const foodKeywords = ['pizza', 'burger', 'hot dog', 'soda', 'coke', 'drink', 'beer'];
    const isOrderQuery = buyKeywords.some(w => lowerMessage.includes(w)) && foodKeywords.some(w => lowerMessage.includes(w));

    if (isOrderQuery) {
      const sectionMatch = lowerMessage.match(/(?:sec|section)\s*(\d+)/i);
      const section = sectionMatch ? sectionMatch[1] : "112";
      const isArg = matchId === 'fifa_2026_001';
      
      let foodItem = { name: "Premium Soda", qty: 1, price: 4.50 };
      if (lowerMessage.includes('pizza')) {
        foodItem = { name: isArg ? "Nonna's Pizza Slice" : "Inglewood Pizza Slice", qty: 2, price: 6.00 };
      } else if (lowerMessage.includes('burger')) {
        foodItem = { name: isArg ? "Bud's Burger" : "LA Street Burger", qty: 1, price: 9.50 };
      }

      const deliveryType = lowerMessage.includes('deliver') || lowerMessage.includes('seat') ? 'delivery' : 'pickup';

      placeOrder({
        matchId,
        items: [foodItem],
        type: deliveryType,
        section
      });
    }

    // 4. Save user message to database
    saveMessage(userId, message, 'user', matchId);

    // 5. Call Claude API with matchId, language, and sentiment parameters
    const aiResponse = await callClaudeAPI(message, matchId, language, sentiment);
    
    // 6. Save AI response to database
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
