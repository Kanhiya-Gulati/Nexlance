/**
 * @fileoverview Main Server Entry Point for NEXLANCE Freelance Marketplace
 *
 * Bootstraps the application by:
 * 1. Loading environment variables
 * 2. Connecting to MongoDB
 * 3. Configuring Express middleware (CORS, JSON parsing, static files)
 * 4. Mounting all API route modules
 * 5. Attaching the global error handler
 * 6. Initializing Socket.IO for real-time features
 * 7. Starting the HTTP server
 *
 * @module server
 */

const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables from .env file
dotenv.config();

// Database connection
const connectDB = require('./config/db');

// Route modules
const authRoutes = require('./routes/authRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const profileRoutes = require('./routes/profileRoutes');
const chatRoutes = require('./routes/chatRoutes');
const savedJobRoutes = require('./routes/savedJobRoutes');

// Middleware
const errorHandler = require('./middleware/errorHandler');

// Socket handler
const setupSocket = require('./socket/socketHandler');

// ──────────────────────────────────────────────
// Initialize Express app and HTTP server
// ──────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ──────────────────────────────────────────────
// Middleware Configuration
// ──────────────────────────────────────────────

/** Enable CORS for the Vite dev server and all origins */
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

/** Parse incoming JSON request bodies */
app.use(express.json());

/** Serve uploaded files (avatars, attachments) as static assets */
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ──────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/saved-jobs', savedJobRoutes);

/** Health-check endpoint */
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'NEXLANCE API is running 🚀' });
});

// ──────────────────────────────────────────────
// Global Error Handler (must be after routes)
// ──────────────────────────────────────────────
app.use(errorHandler);

// ──────────────────────────────────────────────
// Socket.IO Setup
// ──────────────────────────────────────────────

/** Create Socket.IO server with CORS configuration */
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

/** Initialize socket event handlers */
setupSocket(io);

// ──────────────────────────────────────────────
// Start Server
// ──────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

/**
 * Connect to MongoDB and then start listening for HTTP requests.
 * If the DB connection fails, the process exits (handled in connectDB).
 */
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(
      `🚀 NEXLANCE server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
  });
});
