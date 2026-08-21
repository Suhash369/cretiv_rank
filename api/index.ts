import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '../server/src/config/db';
import { seedDatabase } from '../server/src/services/seedService';
import apiRoutes from '../server/src/routes/api';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to ensure DB connection is ready for serverless requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    await seedDatabase();
    next();
  } catch (err) {
    console.error('Vercel API DB connection error:', err);
    next();
  }
});

// Mount backend API routes under /api
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'CretivRank Vercel Serverless API Running' });
});

export default app;
