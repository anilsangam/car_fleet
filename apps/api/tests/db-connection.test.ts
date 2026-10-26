import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../src/config/database';

describe('Database Connection & Logging Suite', () => {
  it('connects to an active MongoDB instance and logs connection host and readyState', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // connectDB uses existing connection if readyState === 1 or connects to uri
    const conn = await connectDB();
    expect(conn.connection.readyState).toBe(1);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DB]'));
    consoleSpy.mockRestore();
  });

  it('fails cleanly and prints structured error when connecting to an unreachable database URI', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Disconnect existing before testing failure
    await mongoose.disconnect();

    const invalidUri = 'mongodb://127.0.0.1:27019/unreachable_db?serverSelectionTimeoutMS=500';

    await expect(connectDB(invalidUri)).rejects.toThrow();

    expect(consoleErrorSpy).toHaveBeenCalledWith('[DB] Connection failed');
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('[DB] Error:'));

    consoleErrorSpy.mockRestore();
  });
});

