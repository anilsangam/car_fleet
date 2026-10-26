import mongoose from 'mongoose';
import { env } from './env';

export async function connectDB(uri?: string): Promise<typeof mongoose> {
  const dbUri = uri || env.MONGODB_URI;
  try {
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log(`Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB connection error:`, err);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error disconnecting from MongoDB', err);
  }
}

