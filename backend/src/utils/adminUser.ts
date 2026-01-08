import { findUserByEmail } from '../db/queries';

let cachedAdminId: string | null = null;

/**
 * Get the admin user ID from the database
 * Uses caching to avoid repeated database queries
 */
export async function getAdminUserId(): Promise<string> {
  if (cachedAdminId) {
    return cachedAdminId;
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const admin = await findUserByEmail(adminEmail);

  if (!admin) {
    throw new Error(`Admin user with email ${adminEmail} not found. Please run the seed script.`);
  }

  cachedAdminId = admin.id;
  return admin.id;
}
