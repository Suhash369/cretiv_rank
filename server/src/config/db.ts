import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dns from 'dns';

// Force Public DNS (8.8.8.8) to fix Windows local ISP querySrv ECONNREFUSED on MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  dns.setDefaultResultOrder('ipv4first');
} catch {}

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || mongoUri === 'memory') {
      console.log('⚡ Initializing MongoMemoryServer for out-of-the-box database...');
      mongoMemoryServer = await MongoMemoryServer.create();
      mongoUri = mongoMemoryServer.getUri();
    }

    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
      console.log(`✅ MongoDB Atlas Connected: ${mongoose.connection.host}`);
    } catch (connErr: any) {
      console.error(`❌ MongoDB Direct Connection Error: ${connErr.message || connErr}`);
      if (mongoUri !== 'memory' && !mongoMemoryServer) {
        console.warn(`⚠️ Could not connect to MongoDB at "${mongoUri}". Falling back to MongoMemoryServer...`);
        mongoMemoryServer = await MongoMemoryServer.create();
        const fallbackUri = mongoMemoryServer.getUri();
        await mongoose.connect(fallbackUri);
        console.log(`✅ MongoMemoryServer Connected: ${mongoose.connection.host}`);
      } else {
        throw connErr;
      }
    }
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
