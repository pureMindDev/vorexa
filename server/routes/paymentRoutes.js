const express = require('express');
const router = express.Router();
const { requestPayment, getUpgradeLink, confirmPayment, getMyPayments } = require('../controllers/paymentController');
const { protect, requireAdmin } = require('../middleware/auth');

router.post('/request', protect, requestPayment);
router.get('/upgrade-link', protect, getUpgradeLink);
router.get('/mine', protect, getMyPayments);
router.put('/:id/confirm', protect, requireAdmin, confirmPayment);

module.exports = router;
