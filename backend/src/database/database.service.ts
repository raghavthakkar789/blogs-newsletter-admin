import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult } from 'pg';
import {
  User,
  Blog,
  Newsletter,
  ActivityLog,
  BlogWithRelations,
  NewsletterWithRelations,
  ActivityLogWithRelations,
  ContentStatus,
} from '../types/database';

// Note: Query functions are imported directly in services that need them
// This service only provides the connection pool

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>('DATABASE_URL');
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
      throw new Error('DATABASE_URL must start with postgresql:// or postgres://');
    }

    this.pool = new Pool({
      connectionString: databaseUrl,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      // SSL configuration
      ssl: false,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });
  }

  async onModuleInit() {
    try {
      await this.pool.query('SELECT NOW()');
      console.log('✅ Database connection pool initialized successfully');
    } catch (error: any) {
      console.error('❌ Failed to connect to database:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log('Database connection pool closed');
  }

  async query<T extends Record<string, any> = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      if (this.configService.get('NODE_ENV') === 'development' && duration > 1000) {
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

  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getClient();
    
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

}

