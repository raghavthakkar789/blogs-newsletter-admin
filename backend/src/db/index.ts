/**
 * Database Connection Layer
 * 
 * Provides a single shared PostgreSQL connection pool.
 * Uses DATABASE_URL from environment variables.
 * All database operations use this pool to prevent connection leaks.
 * 
 * Note: In NestJS, environment variables are loaded by ConfigModule.
 * This file is used by queries.ts which may be imported before NestJS initialization.
 * Ensure DATABASE_URL is set in your environment or .env file.
 */

import { Pool, PoolClient, QueryResult } from 'pg';

// Lazy initialization - pool is created on first use
// This allows NestJS ConfigModule to load .env file first
let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    // Get DATABASE_URL from environment (loaded by NestJS ConfigModule)
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Please check your .env file.'
      );
    }

    // Validate connection string format
    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      throw new Error(
        'DATABASE_URL must start with postgresql:// or postgres://. Current value: ' + 
        (databaseUrl.substring(0, 20) + '...')
      );
    }

    // Create a single shared connection pool
    // Pool configuration optimized for production use
    pool = new Pool({
      connectionString: databaseUrl,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
    });

    // Handle pool errors (don't exit process, just log)
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });
  }
  
  return pool;
}

/**
 * Execute a parameterized query using the connection pool
 * @param text SQL query with parameterized placeholders ($1, $2, etc.)
 * @param params Array of parameter values
 * @returns Promise resolving to query result
 */
export async function query<T extends Record<string, any> = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const poolInstance = getPool();
  const start = Date.now();
  try {
    const result = await poolInstance.query<T>(text, params);
    const duration = Date.now() - start;
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
    }
    
    return result;
  } catch (error: any) {
    console.error('Database query error:', {
      query: text.substring(0, 100),
      error: error.message,
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 * IMPORTANT: Always release the client after use with client.release()!
 * @returns Promise resolving to a pool client
 */
export async function getClient(): Promise<PoolClient> {
  return await getPool().connect();
}

/**
 * Execute a transaction
 * Automatically handles BEGIN, COMMIT, and ROLLBACK
 * @param callback Function that receives a client and performs operations
 * @returns Promise resolving to the return value of the callback
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Gracefully shutdown the connection pool
 * Call this when the application is shutting down
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection pool closed');
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await closePool();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closePool();
  process.exit(0);
});

// Export pool getter for external access if needed
export { getPool as pool };
export default getPool;

