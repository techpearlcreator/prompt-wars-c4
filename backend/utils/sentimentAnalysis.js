/**
 * Simple Rule-Based Sentiment Analyzer
 * Categorizes queries into emotional states: celebratory, disappointed, curious, neutral.
 */
function analyzeSentiment(message) {
  const msg = message.toLowerCase();

  const celebratoryKeywords = [
    'amazing', 'goal', 'great', 'awesome', 'wow', 'fantastic', 'win', 'happy', 'yes!',
    'super', 'beautiful', 'celebrate', 'incredible', 'vamos', 'love'
  ];

  const disappointedKeywords = [
    'disallowed', 'called back', 'unfair', 'lose', 'bad', 'referee', 'sucks', 'frustrated',
    'sad', 'penalty denied', 'foul', 'fools', 'terrible', 'ref', 'stolen'
  ];

  const curiousKeywords = [
    'why', 'how', 'what', 'where', 'explain', 'rules', 'who', 'formation', 'lineup',
    'tactics', 'stats', 'numbers', 'info', 'faq'
  ];

  // Match keyword lists
  if (celebratoryKeywords.some(keyword => msg.includes(keyword))) {
    return 'celebratory';
  }
  
  if (disappointedKeywords.some(keyword => msg.includes(keyword))) {
    return 'disappointed';
  }

  if (curiousKeywords.some(keyword => msg.includes(keyword))) {
    return 'curious';
  }

  return 'neutral';
}

module.exports = {
  analyzeSentiment
};
