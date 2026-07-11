const { Anthropic } = require('@anthropic-ai/sdk');
const { buildSystemPrompt } = require('../utils/systemPrompt');
const { getCurrentMatchSummary } = require('./matchContextService');

/**
 * Call the Claude API with the system prompt containing match context.
 * Falls back to mock responses if CLAUDE_API_KEY is not set.
 * 
 * @param {string} userMessage - The query from the user.
 * @returns {Promise<string>} The response from the LLM or mock fallback.
 */
async function callClaudeAPI(userMessage) {
  const apiKey = process.env.CLAUDE_API_KEY;
  const matchContext = getCurrentMatchSummary();
  const systemPrompt = buildSystemPrompt(matchContext);

  if (!apiKey || apiKey.includes('your_anthropic') || apiKey === '') {
    console.warn("CLAUDE_API_KEY is not configured. Falling back to mock responses.");
    return generateMockResponse(userMessage);
  }

  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      temperature: 0.7,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    });

    if (response.content && response.content[0]) {
      return response.content[0].text;
    }
    throw new Error("Empty response from Anthropic API.");
  } catch (error) {
    console.error("Error calling Claude API:", error.message);
    throw error;
  }
}

/**
 * Smart mock responses for local offline verification.
 */
function generateMockResponse(query) {
  const q = query.toLowerCase();
  
  // Question 1: "What are the rules for VAR review?"
  if (q.includes('var') || q.includes('video assistant')) {
    return "VAR reviews goals, penalties, direct red cards, and mistaken identity. In today's Argentina vs Australia match, it confirmed Julian Alvarez's goal at the 34th minute after checking for offside.";
  }
  
  // Question 2: "Who is Messi?"
  if (q.includes('messi')) {
    return "Lionel Messi is Argentina's central attacking midfielder (CAM) and team captain wearing #10. He scored a brilliant long-range goal in the 12th minute of today's match.";
  }
  
  // Question 3: "What formation is Argentina using today?"
  if (q.includes('formation') && q.includes('argentina')) {
    return "Argentina is set up in a 4-2-3-1 formation today, featuring Lionel Messi in the CAM slot behind forward Julian Alvarez.";
  }
  
  // Question 4: "Why was that goal called back?"
  if (q.includes('called back') || q.includes('disallowed') || q.includes('ruled out')) {
    return "In today's match context, the goal at the 34th minute was actually confirmed by VAR rather than called back. Let me know if you are referring to a different event!";
  }
  
  // Question 5: "How many goals has Messi scored?"
  if (q.includes('how many goals') && q.includes('messi')) {
    return "Lionel Messi has scored 1 goal in today's match, which was the opening long-range strike in the 12th minute.";
  }
  
  // Lineup details
  if (q.includes('lineup') || q.includes('players')) {
    return "Argentina is starting Messi (10), Alvarez (9), and De Paul (7) in a 4-2-3-1. Australia is fielding Souttar (19), Duke (15), and Leckie (7) in a 4-4-2. Who would you like details about?";
  }

  // Score
  if (q.includes('score') || q.includes('who is winning') || q.includes('minute')) {
    return "Argentina is currently leading Australia 2-1 in the 67th minute of the match here at MetLife Stadium.";
  }

  // Redirection for off-topic
  if (q.includes('pizza') || q.includes('weather') || q.includes('code') || q.includes('programming')) {
    return "I am a FIFA stadium operations assistant focused on match-specific support. Please ask about match rules, team stats, lineups, or venue facilities!";
  }

  return "I'm currently assisting fans with the live Argentina vs. Australia match at MetLife Stadium. You can ask me about lineups, the 2-1 live score, VAR rulings, or substitutions!";
}

module.exports = {
  callClaudeAPI
};
