const express = require('express');
const dotenv = require('dotenv');
const verifyAuth = require('./middleware/verifyAuth');
const cors = require('cors');
const helmet = require('helmet');
const reportRoutes = require('./routes/reportRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const guestRoutes = require('./routes/guestRoutes');
const guestLinkRoutes = require('./routes/guestLinkRoutes');
const aiRoutes = require('./routes/aiRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [
      'https://gokeystone.org',
      'https://alex.dev.gokeystone.org', // Dev routes - remove this later
      'https://marcus.dev.gokeystone.org'
    ]
  })
);

// Middleware to parse JSON bodies
app.use(express.json());

// API Routes
app.use('/api/reports', reportRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/guest-links', guestLinkRoutes);
app.use('/api/ai', aiRoutes);
// Notifications routes
app.use('/api', require('./routes/notificationsRoutes'));

// Public route - no authentication required
app.get('/', (req, res) => {
  console.log('Received a request at /');
  res.send('Hello, world!');
});

// Protected route - requires Firebase authentication
app.get('/protected', verifyAuth, (req, res) => {
  res.json({
    message: 'This is a protected route!',
    user: {
      uid: req.user.uid,
      email: req.user.email,
      name: req.user.name || 'No name provided'
    }
  });
});

// Another protected route to demonstrate middleware reusability
app.get('/profile', verifyAuth, (req, res) => {
  res.json({
    message: 'User profile data',
    profile: {
      uid: req.user.uid,
      email: req.user.email,
      emailVerified: req.user.emailVerified,
      name: req.user.name,
      picture: req.user.picture
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Only start the server if this file is run directly (not imported for testing)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export the app for testing
module.exports = app;
