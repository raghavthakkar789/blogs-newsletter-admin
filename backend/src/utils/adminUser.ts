import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { findUserByEmail } from '../db/queries';

@Injectable()
export class AdminUserService {
  private cachedAdminId: string | null = null;

  constructor(private configService: ConfigService) {}

  /**
   * Get the admin user ID from the database
   * Uses caching to avoid repeated database queries
   */
  async getAdminUserId(): Promise<string> {
    if (this.cachedAdminId) {
      return this.cachedAdminId;
    }

    const adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'admin@example.com');
    const admin = await findUserByEmail(adminEmail);

    if (!admin) {
      throw new Error(`Admin user with email ${adminEmail} not found. Please run the seed script.`);
    }

    this.cachedAdminId = admin.id;
    return admin.id;
  }
}

// Standalone function for backward compatibility (used in logging interceptor)
let cachedAdminId: string | null = null;

export async function getAdminUserId(): Promise<string> {
  if (cachedAdminId) {
    return cachedAdminId;
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const { findUserByEmail } = await import('../db/queries');
  const admin = await findUserByEmail(adminEmail);

  if (!admin) {
    throw new Error(`Admin user with email ${adminEmail} not found. Please run the seed script.`);
  }

  cachedAdminId = admin.id;
  return admin.id;
}
