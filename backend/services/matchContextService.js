const mockMatchContext = require('../mockMatchContext');

/**
 * Formats the match context data into a structured string for LLM injection.
 * @returns {string} Fully formatted string describing the current match state.
 */
function getCurrentMatchSummary() {
  const data = mockMatchContext;
  
  const homeLineup = data.teams.home.lineup.join(', ');
  const awayLineup = data.teams.away.lineup.join(', ');
  
  const events = data.recentEvents.map(e => 
    `[Minute ${e.minute}] ${e.type}: ${e.player || e.decision || ""} - ${e.description}`
  ).join('\n');
  
  const rules = Object.entries(data.rules).map(([ruleName, ruleDesc]) => 
    `- ${ruleName.toUpperCase()}: ${ruleDesc}`
  ).join('\n');

  return `--- LIVE MATCH DETAILS ---
Match ID: ${data.matchId}
Date: ${data.date}
Stadium: ${data.liveData.stadium}, ${data.liveData.location}
Attendance: ${data.liveData.attendance}
Weather: ${data.liveData.temperature}

Teams:
- Home: ${data.teams.home.name} (Formation: ${data.teams.home.formation})
  Lineup: ${homeLineup}
- Away: ${data.teams.away.name} (Formation: ${data.teams.away.formation})
  Lineup: ${awayLineup}

Live Score: ${data.teams.home.name} ${data.liveData.score.home} - ${data.liveData.score.away} ${data.teams.away.name}
Current Minute: ${data.liveData.minute}

Recent Key Events:
${events}

Specific FIFA Stadium Rules/FAQs:
${rules}
--------------------------`;
}

module.exports = {
  getCurrentMatchSummary
};
