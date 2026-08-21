import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './config/db';
import { seedDatabase } from './services/seedService';

dotenv.config();

const run = async () => {
  process.env.SEED_SAMPLE_DATA = 'true';
  await connectDB();
  await seedDatabase();
  await disconnectDB();
  process.exit(0);
};

run();
