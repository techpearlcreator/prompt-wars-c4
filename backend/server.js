require('dotenv').config();
const express = require('express');
const cors = require('cors');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');
const healthRouter = require('./routes/health');
const chatRouter = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(logger);

// API Routes
app.use('/health', healthRouter);
app.use('/chat', chatRouter);

// Undefined Routes
app.use('*', (req, res, next) => {
  const error = new Error(`Cannot ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Error handling Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
