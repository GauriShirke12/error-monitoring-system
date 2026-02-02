require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const connectDB = require('./src/config/db');
const errorRoutes = require('./src/routes/errors');

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to database
connectDB();

// ===== Middleware =====
app.use(helmet());
app.use(cors());
app.use(express.json());

// ===== Routes =====
app.use('/api/errors', errorRoutes);

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
