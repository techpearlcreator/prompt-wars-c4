const express = require('express');
const router = express.Router();

/**
 * @route GET /health
 * @desc Verify backend service is alive and healthy
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'FIFA Stadium Challenge Backend'
  });
});

module.exports = router;
