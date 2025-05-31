const express = require('express');
const router = express.Router();

// Get available orders to relay
router.get('/orders', async (req, res) => {
  try {
    // TODO: Implement get available orders for relaying
    res.json({ message: 'Get available orders for relaying' });
  } catch (error) {
    next(error);
  }
});



module.exports = router; 