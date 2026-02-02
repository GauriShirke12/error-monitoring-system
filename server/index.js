require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./src/config/db');
const errorRoutes = require('./src/routes/errors');
const errorRoutes = require('./src/routes/errors');
const analyticsRoutes = require('./src/routes/analytics');

app.use(express.json());

app.use('/api/errors', errorRoutes);
app.use('/api/analytics', analyticsRoutes);

app.listen(4000, () => {
  console.log('Server running on port 4000');
});

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to database
connectDB();

// ===== Middleware =====
app.use(helmet());
app.use(cors());
app.use(express.json());

// ===== Rate Limiter (ONLY for ingestion) =====
const errorIngestionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,          // 1000 errors/min
  standardHeaders: true,
  legacyHeaders: false
});

// ===== Routes =====
app.use('/api/errors', errorIngestionLimiter, errorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date()
  });
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
