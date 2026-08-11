const express = require('express');
const router = express.Router();
const { createTicket, getMyTickets } = require('../controllers/supportController');
const { protect } = require('../middleware/auth');

router.post('/tickets', protect, createTicket);
router.get('/tickets', protect, getMyTickets);

module.exports = router;
