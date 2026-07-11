# 🏆 FIFA 2026 GenAI Stadium Challenge - Chat Assistant

This project is a GenAI-powered Conversational Match Assistant designed to optimize stadium operations and enhance the FIFA World Cup 2026 experience. 

It provides real-time, context-aware assistance to fans at the stadium regarding match rules, player profiles, live score updates, tactical formations, and event clarifications.

## 📁 Repository Structure

```
fifa-stadium-challenge/
├── frontend/             # React (Vite) + Tailwind CSS chat application
├── backend/              # Node.js + Express backend calling Claude API
├── docs/                 # Challenge documentation, plans, and tracker
├── .gitignore            # Node.js / Vite build output exclusions
└── README.md             # This document
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Anthropic Claude API Key (optional; mock responses will be used if not configured)

### Setup & Installation

1. **Clone or download the project** to your local system.

2. **Configure the environment**:
   Navigate to the `backend/` directory, copy `.env.example` to a new file named `.env`, and add your Anthropic Claude API key:
   ```env
   PORT=3001
   CLAUDE_API_KEY=your_actual_anthropic_api_key
   ```

3. **Install dependencies and start the backend**:
   ```bash
   cd backend
   npm install
   npm start
   ```
   The backend will start running on `http://localhost:3001`.

4. **Install dependencies and start the frontend**:
   Open a separate terminal window:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The React app will be served at `http://localhost:5173`. Open this URL in your web browser.

## 📝 Sample Questions to Test
You can chat with the assistant and try asking these in-stadium questions:
1. *"What formation is Argentina using today?"*
2. *"Who is playing in the #10 position?"*
3. *"Why was that goal called back?"*
4. *"What are the rules for VAR review?"*
5. *"How many goals has Messi scored?"*

## 🛠️ Tech Stack
- **Frontend**: React, Vite, Tailwind CSS (Navy & Gold Theme)
- **Backend**: Node.js, Express
- **AI Service**: Claude 3.5 Sonnet (Anthropic SDK) with Match Context Prompt Injection
- **Database**: Mock JSON (Argentina vs. Australia live data)
