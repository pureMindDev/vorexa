require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const { authLimiter, aiLimiter, apiLimiter } = require('./middleware/rateLimit');
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const cbtRoutes = require('./routes/cbtRoutes');
const aiRoutes = require('./routes/aiRoutes');
const groupRoutes = require('./routes/groupRoutes');
const tutorRoutes = require('./routes/tutorRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const bookmarkRoutes = require('./routes/bookmarkRoutes');
const taskRoutes = require('./routes/taskRoutes');
const habitRoutes = require('./routes/habitRoutes');
const postRoutes = require('./routes/postRoutes');
const followRoutes = require('./routes/followRoutes');
const messageRoutes = require('./routes/messageRoutes');
const academicRoutes = require('./routes/academicRoutes');
const careerRoutes = require('./routes/careerRoutes');
const productivityRoutes = require('./routes/productivityRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const supportRoutes = require('./routes/supportRoutes');
const pomodoroRoutes = require('./routes/pomodoroRoutes');
const accountabilityRoutes = require('./routes/accountabilityRoutes');
const liveClassRoutes = require('./routes/liveClassRoutes');
const parentRoutes = require('./routes/parentRoutes');
const centreRoutes = require('./routes/centreRoutes');

const app = express();

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '2mb' }));
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Vorexa API is running' });
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/cbt', cbtRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/career', careerRoutes);
app.use('/api/productivity', productivityRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/pomodoro', pomodoroRoutes);
app.use('/api/accountability', accountabilityRoutes);
app.use('/api/live-classes', liveClassRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/centre', centreRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Vorexa server running on port ${PORT} (HTTP + Socket.IO)`);
});

// Background job: every 60 seconds, turn any reminder whose time has passed
// into a real in-app notification. No cron dependency needed for this scale.
const Reminder = require('./models/Reminder');
const { notify } = require('./services/notificationService');

setInterval(async () => {
  try {
    const dueReminders = await Reminder.find({ remindAt: { $lte: new Date() }, notified: false });
    for (const reminder of dueReminders) {
      await notify({
        userId: reminder.userId,
        type: 'reminder',
        title: 'Reminder',
        message: reminder.title,
        link: '/study-planner',
      });
      reminder.notified = true;
      await reminder.save();
    }
  } catch (error) {
    console.error('Reminder check failed:', error.message);
  }
}, 60 * 1000);
