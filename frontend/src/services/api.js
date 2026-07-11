/**
 * Frontend API Service
 * Handles POST requests to the backend /chat endpoint via Vite proxy.
 */

/**
 * Sends a message to the backend chat API.
 * @param {string} message - User query message.
 * @returns {Promise<Object>} Response object containing reply text and timestamp.
 */
export async function sendChatMessage(message) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
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
