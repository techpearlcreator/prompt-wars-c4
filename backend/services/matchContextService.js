const mockMatchContext = require('../mockMatchContext');

/**
 * Get full match object by matchId.
 * Falls back to first match if ID not found.
 */
function getMatchById(matchId) {
  return mockMatchContext[matchId] || mockMatchContext["fifa_2026_001"];
}

/**
 * Formats the match context data into a structured string for LLM injection.
 * @param {string} matchId - The ID of the match.
 * @returns {string} Fully formatted string describing the current match state.
 */
function getCurrentMatchSummary(matchId) {
  const data = getMatchById(matchId);
  
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

/**
 * Search player profile and status within a match.
 */
function getPlayerStats(matchId, playerName) {
  const data = getMatchById(matchId);
  const nameLower = playerName.toLowerCase();
  
  const homePlayer = data.teams.home.lineup.find(p => p.toLowerCase().includes(nameLower));
  if (homePlayer) {
    return { player: homePlayer, team: data.teams.home.name };
  }
  
  const awayPlayer = data.teams.away.lineup.find(p => p.toLowerCase().includes(nameLower));
  if (awayPlayer) {
    return { player: awayPlayer, team: data.teams.away.name };
  }
  
  return null;
}

/**
 * Get formatted lineup for a team.
 */
function getTeamLineup(matchId, teamName) {
  const data = getMatchById(matchId);
  const nameLower = teamName.toLowerCase();
  
  if (data.teams.home.name.toLowerCase().includes(nameLower)) {
    return { team: data.teams.home.name, lineup: data.teams.home.lineup, formation: data.teams.home.formation };
  }
  if (data.teams.away.name.toLowerCase().includes(nameLower)) {
    return { team: data.teams.away.name, lineup: data.teams.away.lineup, formation: data.teams.away.formation };
  }
  
  return null;
}

/**
 * Get last N events.
 */
function getRecentEvents(matchId, lastN = 5) {
  const data = getMatchById(matchId);
  return data.recentEvents.slice(-lastN);
}

module.exports = {
  getMatchById,
  getCurrentMatchSummary,
  getPlayerStats,
  getTeamLineup,
  getRecentEvents
};
