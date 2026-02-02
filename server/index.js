require('dotenv').config();
const express = require('express');
const connectDB = require('./src/config/db');
const ErrorModel = require('./src/models/Error'); 

const app = express();
const PORT = process.env.PORT || 4000;

// Connect DB
connectDB();

// Middleware
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/* =========================
   STEP 6 & 7: TEST ROUTE
   ========================= */
app.get('/test-db', async (req, res) => {
  try {
    const error = await ErrorModel.findOneAndUpdate(
      { fingerprint: 'typeerror-appjs-23', environment: 'development' },
      {
        $inc: { count: 1 },
        $set: { lastSeen: new Date() }
      },
      { new: true, upsert: true }
    );

    res.json(error);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server (ALWAYS LAST)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
