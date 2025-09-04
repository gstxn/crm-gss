const express = require('express');
const router = express.Router();

// Placeholder endpoint to confirm module is active
router.get('/status', (req, res) => {
  res.json({ message: 'Kanban API v1 ativo' });
});

module.exports = router;