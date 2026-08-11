const express = require('express');
const router = express.Router();
const {
  sendRequest,
  getMyPartnerships,
  respondToRequest,
  endPartnership,
  postCheckIn,
  getCheckIns,
} = require('../controllers/accountabilityController');
const { protect } = require('../middleware/auth');

router.post('/requests', protect, sendRequest);
router.get('/requests', protect, getMyPartnerships);
router.put('/requests/:id', protect, respondToRequest);
router.delete('/requests/:id', protect, endPartnership);

router.post('/:id/checkins', protect, postCheckIn);
router.get('/:id/checkins', protect, getCheckIns);

module.exports = router;
