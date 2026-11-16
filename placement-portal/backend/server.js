
import dns from 'node:dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);

import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/auth.js';
import { aiEnabled } from './services/ai.js';

import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import adminRoutes from './routes/admin.routes.js';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));

app.use(express.json({ limit: '1mb' }));

// Connect to MongoDB before processing API requests.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    aiConfigured: aiEnabled()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

// Export Express app for Vercel.
export default app;

// Start a normal server only during local development.
if (!process.env.VERCEL) {
  const port = process.env.PORT || 5000;

  app.listen(port, () => {
    console.log(`API running on http://localhost:${port}`);
  });
}
