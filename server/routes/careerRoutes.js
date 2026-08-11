const express = require('express');
const router = express.Router();
const {
  getCv,
  upsertCv,
  createOpportunity,
  getOpportunities,
  updateOpportunity,
  deleteOpportunity,
} = require('../controllers/careerController');
const { protect } = require('../middleware/auth');

router.get('/cv', protect, getCv);
router.put('/cv', protect, upsertCv);

router.post('/opportunities', protect, createOpportunity);
router.get('/opportunities', protect, getOpportunities);
router.put('/opportunities/:id', protect, updateOpportunity);
router.delete('/opportunities/:id', protect, deleteOpportunity);

module.exports = router;
