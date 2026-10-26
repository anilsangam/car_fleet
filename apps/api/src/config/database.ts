import mongoose from 'mongoose';
import { env } from './env';

const READY_STATE_MAP: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

let listenersAttached = false;

function setupConnectionEventListeners(): void {
  if (listenersAttached) return;

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB] Disconnected from MongoDB');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[DB] Reconnected to MongoDB');
  });

  mongoose.connection.on('error', (err: any) => {
    console.error(`[DB] Connection error: ${err?.message || err}`);
  });

  listenersAttached = true;
}

export async function connectDB(uri?: string): Promise<typeof mongoose> {
  // If already connected, avoid duplicate connection attempts
  if (mongoose.connection.readyState === 1) {
    const host = mongoose.connection.host || 'localhost';
    const dbName = mongoose.connection.name || 'car_rental';
    console.log('[DB] Already connected to MongoDB');
    console.log(`[DB] Host: ${host}`);
    console.log(`[DB] Database: ${dbName}`);
    console.log(`[DB] Ready state: connected`);
    return mongoose;
  }

  setupConnectionEventListeners();

  const dbUri = uri || env.MONGODB_URI;
  console.log('[DB] Connecting to MongoDB...');

  try {
    const conn = await mongoose.connect(dbUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });

    const host = conn.connection.host || 'localhost';
    const dbName = conn.connection.name || 'car_rental';
    const readyState = READY_STATE_MAP[conn.connection.readyState] || 'connected';

    console.log('[DB] Connected successfully');
    console.log(`[DB] Host: ${host}`);
    console.log(`[DB] Database: ${dbName}`);
    console.log(`[DB] Ready state: ${readyState}`);

    return conn;
  } catch (err: any) {
    console.error('[DB] Connection failed');
    console.error(`[DB] Error: ${err?.message || err}`);
    if (env.NODE_ENV === 'development' && err?.stack) {
      console.error(`[DB] Stack trace:\n${err.stack}`);
    }
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('[DB] Disconnected from MongoDB');
    }
  } catch (err: any) {
    console.error('[DB] Error during disconnect:', err?.message || err);
  }
}
