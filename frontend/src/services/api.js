/**
 * Frontend API Service
 * Handles POST requests to the backend /chat endpoint and ratings / feedback.
 */

/**
 * Sends a message to the backend chat API with language, user, and match context.
 */
export async function sendChatMessage(message, userId = 'anonymous', matchId = 'fifa_2026_001', language = 'English') {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, userId, matchId, language }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error?.message || `Server responded with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Service Error:", error.message);
    throw error;
  }
}

/**
 * Fetch chat history for user.
 */
export async function fetchChatHistory(userId) {
  try {
    const response = await fetch(`/api/chat/history/${userId}`);
    if (!response.ok) throw new Error("Failed to load chat history.");
    return await response.json();
  } catch (error) {
    console.error("History Fetch Error:", error.message);
    return { history: [] };
  }
}

/**
 * Sends user rating feedback for a specific AI message.
 */
export async function sendMessageFeedback(messageId, rating) {
  try {
    const response = await fetch('/api/chat/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageId, rating }),
    });

    if (!response.ok) throw new Error("Failed to submit feedback.");
    return await response.json();
  } catch (error) {
    console.error("Feedback Service Error:", error.message);
    throw error;
  }
}

/**
 * Fetch statistics data for the analytics dashboard overlay.
 */
export async function fetchAnalytics() {
  try {
    const response = await fetch('/api/analytics');
    if (!response.ok) throw new Error("Failed to fetch analytics statistics.");
    return await response.json();
  } catch (error) {
    console.error("Analytics Fetch Error:", error.message);
    throw error;
  }
}

/**
 * Fetch live concessions queues and wait times.
 */
export async function fetchConcessionsQueue(matchId) {
  try {
    const response = await fetch(`/api/concessions/${matchId}`);
    if (!response.ok) throw new Error("Failed to fetch live wait times.");
    return await response.json();
  } catch (error) {
    console.error("Concessions Fetch Error:", error.message);
    throw error;
  }
}
