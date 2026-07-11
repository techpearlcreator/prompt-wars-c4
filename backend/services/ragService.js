const fs = require('fs');
const path = require('path');

const VENUE_GUIDE_FILE = path.join(__dirname, '../data/stadiumVenueGuide.json');

/**
 * Parses user query and retrieves matching sections from the venue guide for the match's stadium.
 * 
 * @param {string} matchId - The active match ID.
 * @param {string} query - The user's typed question.
 * @returns {string} Formatted context block describing relevant stadium guides, or empty string.
 */
function retrieveVenueContext(matchId, query) {
  try {
    if (!fs.existsSync(VENUE_GUIDE_FILE)) return "";

    const raw = fs.readFileSync(VENUE_GUIDE_FILE, 'utf8');
    const guideDb = JSON.parse(raw);

    const stadiumGuide = guideDb[matchId];
    if (!stadiumGuide) return "";

    const cleanQueryTokens = query
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .split(/\s+/);

    // Score each section based on matching keywords
    const scoredSections = stadiumGuide.sections.map(sec => {
      let score = 0;
      sec.keywords.forEach(keyword => {
        if (cleanQueryTokens.includes(keyword.toLowerCase())) {
          score += 2; // Exact word match
        } else {
          // Check for partial substring match (e.g. "toilet" matches "toilets")
          cleanQueryTokens.forEach(token => {
            if (token.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(token)) {
              if (token.length > 3) score += 1;
            }
          });
        }
      });
      return { ...sec, score };
    });

    // Filter out zero scores and sort by score descending
    const matches = scoredSections
      .filter(sec => sec.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2); // Top 2 matches

    if (matches.length === 0) return "";

    console.log(`[RAG Service] Found ${matches.length} matching sections for query "${query}"`);
    
    // Format matches
    const formattedMatches = matches.map(m => 
      `[FACILITY: ${m.title}]\nCategory: ${m.category}\nInformation: ${m.content}`
    ).join('\n\n');

    return `--- RELEVANT STADIUM VENUE GUIDE INFO (${stadiumGuide.stadiumName}) ---\n${formattedMatches}\n---------------------------------------------------------`;
  } catch (error) {
    console.error("Error in RAG service retriever:", error);
    return "";
  }
}

module.exports = {
  retrieveVenueContext
};
