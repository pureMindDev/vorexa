const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  updateUserStatus,
  updateUserRole,
  getPendingTutors,
  getAllTutors,
  setTutorVerification,
  getPayments,
  getReports,
  resolveReport,
  removePost,
  setCoursePublished,
  getSupportTickets,
  respondToTicket,
} = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect, requireAdmin);

router.get('/dashboard', getDashboardStats);

router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.put('/users/:id/role', updateUserRole);

router.get('/tutors/pending', getPendingTutors);
router.get('/tutors', getAllTutors);
router.put('/tutors/:id/verify', setTutorVerification);

router.get('/payments', getPayments);

router.get('/reports', getReports);
router.put('/reports/:id', resolveReport);
router.delete('/posts/:id', removePost);
router.put('/courses/:id/publish', setCoursePublished);

router.get('/support-tickets', getSupportTickets);
router.put('/support-tickets/:id', respondToTicket);

module.exports = router;
