require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');
const chatRouter = require('./routes/chat');
const analyticsRouter = require('./routes/analytics');
const adminRouter = require('./routes/admin');
const concessionsRouter = require('./routes/concessions');
const incidentsRouter = require('./routes/incidents');
const ordersRouter = require('./routes/orders');
const reconnectionRouter = require('./routes/reconnection');
const merchRouter = require('./routes/merch');
const transitRouter = require('./routes/transit');
const triviaRouter = require('./routes/trivia');
const commentaryRouter = require('./routes/commentary');
const { initWebsocket } = require('./services/websocketService');

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Websocket service
initWebsocket(server);

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(logger);

// Welcome Root Route
app.get('/', (req, res) => {
  res.json({
    status: "online",
    message: "FIFA World Cup 2026 - Stadium API Service",
    endpoints: {
      health: "/health",
      chat: "/chat",
      analytics: "/analytics",
      concessions: "/concessions/:matchId",
      incidents: "/incidents/:matchId",
      orders: "/orders/:matchId",
      reconnection: "/reconnection/:matchId",
      merch: "/merch/:matchId",
      transit: "/transit/:matchId",
      trivia: "/trivia/leaderboard/:matchId",
      commentary: "/commentary/:matchId"
    }
  });
});

// API Routes
app.use('/health', healthRouter);
app.use('/chat', chatRouter);
app.use('/analytics', analyticsRouter);
app.use('/admin', adminRouter);
app.use('/concessions', concessionsRouter);
app.use('/incidents', incidentsRouter);
app.use('/orders', ordersRouter);
app.use('/reconnection', reconnectionRouter);
app.use('/merch', merchRouter);
app.use('/transit', transitRouter);
app.use('/trivia', triviaRouter);
app.use('/commentary', commentaryRouter);

// Undefined Routes
app.use('*', (req, res, next) => {
  const error = new Error(`Cannot ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Error handling Middleware
app.use(errorHandler);

// Start Server on HTTP Server instance
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
