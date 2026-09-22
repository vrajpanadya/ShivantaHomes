import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { env } from './env';

let memoryServer: { stop: () => Promise<unknown> } | null = null;

/**
 * Connects to MongoDB Atlas when MONGODB_URI is provided.
 * Falls back to an in-memory MongoDB server for local development/testing.
 */
export async function connectDB(): Promise<string> {
  let uri = env.MONGODB_URI;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    // Persistent dbPath so dev data survives restarts when Atlas is not configured.
    const dbPath = path.join(process.cwd(), '.mongodb-data');
    fs.mkdirSync(dbPath, { recursive: true });
    try {
      // Clear stale lock from an unclean shutdown so mongod can start.
      fs.rmSync(path.join(dbPath, 'mongod.lock'), { force: true });
    } catch {
      /* ignore */
    }
    const mem = await MongoMemoryServer.create({ instance: { dbName: 'shivanta_homes', dbPath } });
    memoryServer = mem;
    uri = mem.getUri();
    console.warn(
      '[db] MONGODB_URI not set → using in-memory MongoDB (data resets on restart). Set MONGODB_URI for Atlas.'
    );
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('[db] MongoDB connected');
  return uri;
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
