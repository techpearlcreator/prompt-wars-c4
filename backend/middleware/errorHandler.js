/**
 * Global Error Handler Middleware
 */
function errorHandler(err, req, res, next) {
  console.error("Unhandled Backend Error:", err.stack || err.message);
  
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({
    error: {
      status,
      message
    }
  });
}

module.exports = errorHandler;
