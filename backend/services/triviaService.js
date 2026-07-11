const fs = require('fs');
const path = require('path');

const TRIVIA_FILE = path.join(__dirname, '../data/trivia.json');

/**
 * Reads trivia database from file.
 */
function readDb() {
  try {
    if (!fs.existsSync(TRIVIA_FILE)) return {};
    const raw = fs.readFileSync(TRIVIA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading trivia file:", err);
    return {};
  }
}

/**
 * Writes to trivia database file.
 */
function writeDb(data) {
  try {
    fs.writeFileSync(TRIVIA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error("Error writing to trivia file:", err);
  }
}

/**
 * Returns leaderboard listing for a specific match.
 */
function getLeaderboard(matchId) {
  const db = readDb();
  const matchData = db[matchId] || { questions: [], leaderboard: [] };
  return matchData.leaderboard || [];
}

/**
 * Adds a new trivia question to the database.
 */
function addTriviaQuestion(matchId, { questionId, question, options, correctIndex }) {
  const db = readDb();
  if (!db[matchId]) {
    db[matchId] = { questions: [], leaderboard: [] };
  }

  const newQuestion = {
    id: questionId || `q_${Date.now()}`,
    question,
    options,
    correctIndex: parseInt(correctIndex)
  };

  db[matchId].questions.push(newQuestion);
  writeDb(db);

  return newQuestion;
}

/**
 * Validates a trivia answer and awards points on correct matching selection.
 */
function submitAnswer({ matchId, username, questionId, selectedIndex }) {
  const db = readDb();
  const matchData = db[matchId];
  if (!matchData) return { correct: false, error: "Match not found" };

  const question = matchData.questions.find(q => q.id === questionId);
  if (!question) return { correct: false, error: "Question not found" };

  const isCorrect = question.correctIndex === parseInt(selectedIndex);
  let points = 0;

  if (isCorrect) {
    const cleanUsername = (username || "Anonymous").trim();
    if (!matchData.leaderboard) {
      matchData.leaderboard = [];
    }

    let fan = matchData.leaderboard.find(f => f.username.toLowerCase() === cleanUsername.toLowerCase());
    if (fan) {
      fan.points += 10;
      points = fan.points;
    } else {
      fan = { username: cleanUsername, points: 10 };
      matchData.leaderboard.push(fan);
      points = 10;
    }

    // Sort leaderboard by points descending
    matchData.leaderboard.sort((a, b) => b.points - a.points);
    writeDb(db);
  }

  return {
    correct: isCorrect,
    points,
    correctIndex: question.correctIndex
  };
}

module.exports = {
  getLeaderboard,
  addTriviaQuestion,
  submitAnswer
};
