/**
 * Mock Match Context Database
 * Ground truth data representing the current live match state.
 */
const mockMatchContext = {
  "matchId": "fifa_2026_001",
  "date": "2026-06-10",
  "teams": {
    "home": {
      "name": "Argentina",
      "lineup": [
        "E. Martinez (23) - GK",
        "Molina (26) - RB",
        "Romero (13) - CB",
        "Otamendi (19) - CB",
        "Tagliafico (3) - LB",
        "De Paul (7) - CM",
        "Fernandez (24) - CM",
        "Mac Allister (20) - CM",
        "Messi (10) - CAM",
        "Di Maria (11) - RW",
        "Alvarez (9) - ST"
      ],
      "formation": "4-2-3-1"
    },
    "away": {
      "name": "Australia",
      "lineup": [
        "Ryan (1) - GK",
        "Atkinson (3) - RB",
        "Souttar (19) - CB",
        "Rowles (4) - CB",
        "Behich (16) - LB",
        "Baccus (17) - DM",
        "Irvine (22) - CM",
        "McGree (14) - CM",
        "Leckie (7) - RW",
        "Duke (15) - ST",
        "Goodwin (23) - LW"
      ],
      "formation": "4-4-2"
    }
  },
  "liveData": {
    "score": { "home": 2, "away": 1 },
    "minute": 67,
    "stadium": "MetLife Stadium",
    "location": "East Rutherford, New Jersey",
    "attendance": 82500,
    "temperature": "22°C (Clear)"
  },
  "recentEvents": [
    { "minute": 12, "type": "GOAL", "team": "home", "player": "Messi", "description": "Brilliant long-range strike into the top left corner after a quick pass from De Paul." },
    { "minute": 34, "type": "VAR_REVIEW", "decision": "Goal confirmed", "description": "Referee checked VAR for potential offside in the buildup to Alvarez's goal check, but the goal stood." },
    { "minute": 55, "type": "SUBSTITUTION", "team": "away", "player_out": "Leckie", "player_in": "Irvine", "description": "Tactical change to strengthen midfield." },
    { "minute": 61, "type": "GOAL", "team": "away", "player": "Duke", "description": "Header from a Goodwin corner deflection." }
  ],
  "rules": {
    "offside": "A player is in an offside position if they are nearer to the opponent's goal line than both the ball and the second-last opponent (usually the last defender) at the moment the ball is played to them, unless they are in their own half.",
    "var": "Video Assistant Referee (VAR) reviews four types of game-changing decisions: Goals/no goals, Penalty/no penalty, Direct red card (not second yellow), and Mistaken identity. The VAR can only assist when a 'clear and obvious error' or 'serious missed incident' occurs.",
    "substitutions": "In FIFA matches, teams are allowed up to 5 substitutions, which can be made in a maximum of 3 stoppages in play (excluding halftime). If a match goes to extra time, teams get 1 additional substitution.",
    "handball": "A handball is committed when a player deliberately touches the ball with their hand or arm, or if their hand/arm makes their body unnaturally bigger while blocking the ball. Accidental handballs by attackers immediately preceding a goal are also penalized."
  }
};

module.exports = mockMatchContext;
