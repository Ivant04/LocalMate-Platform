require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const seedDatabase = require('./config/seeder');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const helperRoutes = require('./routes/helper.routes');
const bookingRoutes = require('./routes/booking.routes');
const reviewRoutes = require('./routes/review.routes');
const messageRoutes = require('./routes/message.routes');
const paymentRoutes = require('./routes/payment.routes');
const Booking = require('./models/Booking');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO for real-time messaging and location tracking
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// API Routes matching Spring Boot
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/helpers', helperRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/reviews', reviewRoutes); // Alias
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/payment', paymentRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'UP',
    message: 'LocalMate Node.js Express Backend is active and running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'UP', service: 'LocalMate Backend (Node.js)' });
});

// Real-time Socket.IO events
io.on('connection', (socket) => {
  console.log('Socket client connected:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);
  });

  socket.on('leave_room', (room) => {
    socket.leave(room);
    console.log(`Socket ${socket.id} left room ${room}`);
  });

  socket.on('send_message', (msg) => {
    if (msg && msg.conversationId) {
      io.to(msg.conversationId).emit('new_message', msg);
    }
  });

  socket.on('location_update', async (data) => {
    if (data && data.bookingId) {
      io.to(`booking_${data.bookingId}`).emit('location_received', data);
      try {
        const updateFields = {};
        if (data.isHelper) {
          updateFields.helperLatitude = data.latitude;
          updateFields.helperLongitude = data.longitude;
          updateFields.helperSharingLocation = true;
        } else {
          updateFields.customerLatitude = data.latitude;
          updateFields.customerLongitude = data.longitude;
          updateFields.customerSharingLocation = true;
        }
        await Booking.updateOne({ _id: data.bookingId }, { $set: updateFields });
      } catch (err) {
        console.warn('Could not persist location update:', err.message);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket client disconnected:', socket.id);
  });
});

// Background job: Auto-expire stale pending bookings every 15s (matching Java @Scheduled)
setInterval(async () => {
  try {
    const now = new Date();
    const result = await Booking.updateMany(
      {
        status: 'PENDING',
        expiresAt: { $lt: now },
      },
      {
        $set: { status: 'EXPIRED', updatedAt: now },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`Auto-expired ${result.modifiedCount} stale pending bookings.`);
    }
  } catch (err) {
    // Ignore interval error
  }
}, 15000);

const PORT = process.env.PORT || 8080;

// Start server after DB connection
const startServer = async () => {
  try {
    await connectDB();
    await seedDatabase();

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`⚠️ Cổng ${PORT} hiện đang bận (EADDRINUSE). Đang giải phóng và thử lại...`);
      } else {
        console.error('Server error:', err);
      }
    });

    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 LocalMate Node.js Backend running on http://localhost:${PORT}`);
      console.log(`📦 REST Endpoints: /api/v1/{auth, users, helpers, bookings, reviews, messages, payment}`);
      console.log(`⚡ Socket.IO active for real-time chat & GPS location`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
