/**
 * Database Query Helpers
 * 
 * Reusable SQL query functions with proper parameterization.
 * All queries use parameterized statements to prevent SQL injection.
 * These functions replace Prisma queries.
 */

import { query } from './index';
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

// ============================================================================
// USER QUERIES
// ============================================================================

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM "User" WHERE email = $1 LIMIT 1',
    [email]
  );
  return result.rows[0] || null;
}

export async function findUserById(id: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM "User" WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0] || null;
}

// ============================================================================
// BLOG QUERIES
// ============================================================================

export interface BlogFilters {
  status?: ContentStatus;
  createdById?: string;
  search?: string;
}

export interface BlogListResult {
  blogs: BlogWithRelations[];
  total: number;
}

/**
 * Get blogs with pagination and filters
 * Replaces: prisma.blog.findMany() with includes
 */
export async function findBlogs(
  page: number = 1,
  limit: number = 20,
  filters: BlogFilters = {}
): Promise<BlogListResult> {
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  // Build WHERE conditions
  if (filters.status) {
    conditions.push(`b.status = $${paramIndex++}`);
    params.push(filters.status);
  }

  if (filters.createdById) {
    conditions.push(`b."createdById" = $${paramIndex++}`);
    params.push(filters.createdById);
  }

  if (filters.search) {
    conditions.push(`(
      b.title ILIKE $${paramIndex} OR 
      b.content ILIKE $${paramIndex} OR 
      b.summary ILIKE $${paramIndex}
    )`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // Count query
  const countQuery = `
    SELECT COUNT(*) as total
    FROM "Blog" b
    ${whereClause}
  `;
  const countResult = await query<{ total: string }>(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  // Data query with joins for relations
  const dataQuery = `
    SELECT 
      b.id, b.title, b.content, b.summary, b.category, b.tags, b.author, b.image,
      b.status, b."createdById", b."approvedById", b."createdAt", b."updatedAt",
      b."publishedAt", b."editHistory", b."lastEditedAt", b."lastEditedBy",
      json_build_object(
        'id', u1.id,
        'firstName', u1."firstName",
        'lastName', u1."lastName",
        'email', u1.email
      ) as "createdBy",
      CASE 
        WHEN u2.id IS NOT NULL THEN json_build_object(
          'id', u2.id,
          'firstName', u2."firstName",
          'lastName', u2."lastName"
        )
        ELSE NULL
      END as "approvedBy"
    FROM "Blog" b
    LEFT JOIN "User" u1 ON b."createdById" = u1.id
    LEFT JOIN "User" u2 ON b."approvedById" = u2.id
    ${whereClause}
    ORDER BY b."updatedAt" DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  params.push(limit, offset);

  const dataResult = await query(dataQuery, params);
  
  // Transform results to match expected structure
  const blogs: BlogWithRelations[] = dataResult.rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    category: row.category,
    tags: row.tags || [],
    author: row.author,
    image: row.image,
    status: row.status,
    createdById: row.createdById,
    approvedById: row.approvedById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    editHistory: row.editHistory,
    lastEditedAt: row.lastEditedAt,
    lastEditedBy: row.lastEditedBy,
    createdBy: row.createdBy,
    approvedBy: row.approvedBy,
  }));

  return { blogs, total };
}

/**
 * Get a single blog by ID with relations
 * Replaces: prisma.blog.findUnique() with include
 */
export async function findBlogById(id: string): Promise<BlogWithRelations | null> {
  const result = await query(`
    SELECT 
      b.id, b.title, b.content, b.summary, b.category, b.tags, b.author, b.image,
      b.status, b."createdById", b."approvedById", b."createdAt", b."updatedAt",
      b."publishedAt", b."editHistory", b."lastEditedAt", b."lastEditedBy",
      json_build_object(
        'id', u1.id,
        'firstName', u1."firstName",
        'lastName', u1."lastName",
        'email', u1.email
      ) as "createdBy",
      CASE 
        WHEN u2.id IS NOT NULL THEN json_build_object(
          'id', u2.id,
          'firstName', u2."firstName",
          'lastName', u2."lastName"
        )
        ELSE NULL
      END as "approvedBy"
    FROM "Blog" b
    LEFT JOIN "User" u1 ON b."createdById" = u1.id
    LEFT JOIN "User" u2 ON b."approvedById" = u2.id
    WHERE b.id = $1
    LIMIT 1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0] as any;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    category: row.category,
    tags: row.tags || [],
    author: row.author,
    image: row.image,
    status: row.status,
    createdById: row.createdById,
    approvedById: row.approvedById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    editHistory: row.editHistory,
    lastEditedAt: row.lastEditedAt,
    lastEditedBy: row.lastEditedBy,
    createdBy: row.createdBy,
    approvedBy: row.approvedBy,
  };
}

/**
 * Create a new blog
 * Replaces: prisma.blog.create()
 */
export async function createBlog(
  data: Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Blog> {
  const result = await query<Blog>(`
    INSERT INTO "Blog" (
      title, content, summary, category, tags, author, image, status,
      "createdById", "approvedById", "publishedAt", "editHistory",
      "lastEditedAt", "lastEditedBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING *
  `, [
    data.title,
    data.content,
    data.summary,
    data.category,
    data.tags || [],
    data.author,
    data.image,
    data.status,
    data.createdById,
    data.approvedById,
    data.publishedAt,
    data.editHistory ? JSON.stringify(data.editHistory) : null,
    data.lastEditedAt,
    data.lastEditedBy,
  ]);

  return result.rows[0];
}

/**
 * Update a blog
 * Replaces: prisma.blog.update()
 */
export async function updateBlog(
  id: string,
  updates: Partial<Omit<Blog, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Blog> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  // Build dynamic update query
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      // Handle JSONB fields
      if (key === 'editHistory' && value !== null) {
        fields.push(`"${key}" = $${paramIndex++}`);
        values.push(JSON.stringify(value));
      } else if (key === 'tags' && Array.isArray(value)) {
        // PostgreSQL arrays are handled automatically by pg library
        fields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      } else {
        fields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  // Always update updatedAt (handled by trigger, but explicit for clarity)
  fields.push(`"updatedAt" = CURRENT_TIMESTAMP`);

  values.push(id);
  const queryText = `
    UPDATE "Blog"
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await query<Blog>(queryText, values);
  return result.rows[0];
}

/**
 * Delete a blog
 * Replaces: prisma.blog.delete()
 */
export async function deleteBlog(id: string): Promise<void> {
  await query('DELETE FROM "Blog" WHERE id = $1', [id]);
}

/**
 * Bulk update blog status
 * Replaces: prisma.blog.updateMany()
 */
export async function bulkUpdateBlogStatus(
  ids: string[],
  status: ContentStatus,
  approvedById: string | null,
  publishedAt: Date | null
): Promise<number> {
  const result = await query(`
    UPDATE "Blog"
    SET 
      status = $1,
      "approvedById" = $2,
      "publishedAt" = $3,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ANY($4::text[])
  `, [status, approvedById, publishedAt, ids]);

  return result.rowCount || 0;
}

// ============================================================================
// NEWSLETTER QUERIES
// ============================================================================

export interface NewsletterFilters {
  status?: ContentStatus;
  createdById?: string;
  search?: string;
}

export interface NewsletterListResult {
  newsletters: NewsletterWithRelations[];
  total: number;
}

/**
 * Get newsletters with pagination and filters
 * Replaces: prisma.newsletter.findMany() with includes
 */
export async function findNewsletters(
  page: number = 1,
  limit: number = 20,
  filters: NewsletterFilters = {}
): Promise<NewsletterListResult> {
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.status) {
    conditions.push(`n.status = $${paramIndex++}`);
    params.push(filters.status);
  }

  if (filters.createdById) {
    conditions.push(`n."createdById" = $${paramIndex++}`);
    params.push(filters.createdById);
  }

  if (filters.search) {
    conditions.push(`(
      n.title ILIKE $${paramIndex} OR 
      n.content ILIKE $${paramIndex} OR 
      n.summary ILIKE $${paramIndex}
    )`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countQuery = `
    SELECT COUNT(*) as total
    FROM "Newsletter" n
    ${whereClause}
  `;
  const countResult = await query<{ total: string }>(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  const dataQuery = `
    SELECT 
      n.id, n.title, n.content, n.summary, n.category, n.tags, n.image,
      n.status, n."createdById", n."approvedById", n."createdAt", n."updatedAt",
      n."publishedAt", n."editHistory", n."lastEditedAt", n."lastEditedBy",
      json_build_object(
        'id', u1.id,
        'firstName', u1."firstName",
        'lastName', u1."lastName",
        'email', u1.email
      ) as "createdBy",
      CASE 
        WHEN u2.id IS NOT NULL THEN json_build_object(
          'id', u2.id,
          'firstName', u2."firstName",
          'lastName', u2."lastName"
        )
        ELSE NULL
      END as "approvedBy"
    FROM "Newsletter" n
    LEFT JOIN "User" u1 ON n."createdById" = u1.id
    LEFT JOIN "User" u2 ON n."approvedById" = u2.id
    ${whereClause}
    ORDER BY n."updatedAt" DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  params.push(limit, offset);

  const dataResult = await query(dataQuery, params);
  
  const newsletters: NewsletterWithRelations[] = dataResult.rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    category: row.category,
    tags: row.tags || [],
    image: row.image,
    status: row.status,
    createdById: row.createdById,
    approvedById: row.approvedById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    editHistory: row.editHistory,
    lastEditedAt: row.lastEditedAt,
    lastEditedBy: row.lastEditedBy,
    createdBy: row.createdBy,
    approvedBy: row.approvedBy,
  }));

  return { newsletters, total };
}

/**
 * Get a single newsletter by ID with relations
 * Replaces: prisma.newsletter.findUnique() with include
 */
export async function findNewsletterById(id: string): Promise<NewsletterWithRelations | null> {
  const result = await query(`
    SELECT 
      n.id, n.title, n.content, n.summary, n.category, n.tags, n.image,
      n.status, n."createdById", n."approvedById", n."createdAt", n."updatedAt",
      n."publishedAt", n."editHistory", n."lastEditedAt", n."lastEditedBy",
      json_build_object(
        'id', u1.id,
        'firstName', u1."firstName",
        'lastName', u1."lastName",
        'email', u1.email
      ) as "createdBy",
      CASE 
        WHEN u2.id IS NOT NULL THEN json_build_object(
          'id', u2.id,
          'firstName', u2."firstName",
          'lastName', u2."lastName"
        )
        ELSE NULL
      END as "approvedBy"
    FROM "Newsletter" n
    LEFT JOIN "User" u1 ON n."createdById" = u1.id
    LEFT JOIN "User" u2 ON n."approvedById" = u2.id
    WHERE n.id = $1
    LIMIT 1
  `, [id]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0] as any;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    summary: row.summary,
    category: row.category,
    tags: row.tags || [],
    image: row.image,
    status: row.status,
    createdById: row.createdById,
    approvedById: row.approvedById,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt,
    editHistory: row.editHistory,
    lastEditedAt: row.lastEditedAt,
    lastEditedBy: row.lastEditedBy,
    createdBy: row.createdBy,
    approvedBy: row.approvedBy,
  };
}

/**
 * Create a new newsletter
 * Replaces: prisma.newsletter.create()
 */
export async function createNewsletter(
  data: Omit<Newsletter, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Newsletter> {
  const result = await query<Newsletter>(`
    INSERT INTO "Newsletter" (
      title, content, summary, category, tags, image, status,
      "createdById", "approvedById", "publishedAt", "editHistory",
      "lastEditedAt", "lastEditedBy"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *
  `, [
    data.title,
    data.content,
    data.summary,
    data.category,
    data.tags || [],
    data.image,
    data.status,
    data.createdById,
    data.approvedById,
    data.publishedAt,
    data.editHistory ? JSON.stringify(data.editHistory) : null,
    data.lastEditedAt,
    data.lastEditedBy,
  ]);

  return result.rows[0];
}

/**
 * Update a newsletter
 * Replaces: prisma.newsletter.update()
 */
export async function updateNewsletter(
  id: string,
  updates: Partial<Omit<Newsletter, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Newsletter> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      if (key === 'editHistory' && value !== null) {
        fields.push(`"${key}" = $${paramIndex++}`);
        values.push(JSON.stringify(value));
      } else if (key === 'tags' && Array.isArray(value)) {
        fields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      } else {
        fields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  values.push(id);

  const queryText = `
    UPDATE "Newsletter"
    SET ${fields.join(', ')}
    WHERE id = $${paramIndex}
    RETURNING *
  `;

  const result = await query<Newsletter>(queryText, values);
  return result.rows[0];
}

/**
 * Delete a newsletter
 * Replaces: prisma.newsletter.delete()
 */
export async function deleteNewsletter(id: string): Promise<void> {
  await query('DELETE FROM "Newsletter" WHERE id = $1', [id]);
}

/**
 * Bulk update newsletter status
 * Replaces: prisma.newsletter.updateMany()
 */
export async function bulkUpdateNewsletterStatus(
  ids: string[],
  status: ContentStatus,
  approvedById: string | null,
  publishedAt: Date | null
): Promise<number> {
  const result = await query(`
    UPDATE "Newsletter"
    SET 
      status = $1,
      "approvedById" = $2,
      "publishedAt" = $3,
      "updatedAt" = CURRENT_TIMESTAMP
    WHERE id = ANY($4::text[])
  `, [status, approvedById, publishedAt, ids]);

  return result.rowCount || 0;
}

// ============================================================================
// ACTIVITY LOG QUERIES
// ============================================================================

export interface ActivityLogFilters {
  userId?: string;
  action?: string;
  entityType?: string;
}

/**
 * Get activity logs with pagination and filters
 * Replaces: prisma.activityLog.findMany() with include
 */
export async function findActivityLogs(
  page: number = 1,
  limit: number = 50,
  filters: ActivityLogFilters = {}
): Promise<{ logs: ActivityLogWithRelations[]; total: number }> {
  const offset = (page - 1) * limit;
  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (filters.userId) {
    conditions.push(`al."userId" = $${paramIndex++}`);
    params.push(filters.userId);
  }

  if (filters.action) {
    conditions.push(`al.action = $${paramIndex++}`);
    params.push(filters.action);
  }

  if (filters.entityType) {
    conditions.push(`al."entityType" = $${paramIndex++}`);
    params.push(filters.entityType);
  }

  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const countQuery = `
    SELECT COUNT(*) as total
    FROM "ActivityLog" al
    ${whereClause}
  `;
  const countResult = await query<{ total: string }>(countQuery, params);
  const total = parseInt(countResult.rows[0].total, 10);

  const dataQuery = `
    SELECT 
      al.id, al."userId", al.action, al."entityType", al."entityId",
      al.details, al."ipAddress", al."userAgent", al."createdAt",
      json_build_object(
        'id', u.id,
        'firstName', u."firstName",
        'lastName', u."lastName",
        'email', u.email
      ) as user
    FROM "ActivityLog" al
    LEFT JOIN "User" u ON al."userId" = u.id
    ${whereClause}
    ORDER BY al."createdAt" DESC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}
  `;
  params.push(limit, offset);

  const dataResult = await query(dataQuery, params);
  
  const logs: ActivityLogWithRelations[] = dataResult.rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    details: row.details,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
    user: row.user,
  }));

  return { logs, total };
}

/**
 * Create an activity log entry
 * Replaces: prisma.activityLog.create()
 */
export async function createActivityLog(
  data: Omit<ActivityLog, 'id' | 'createdAt'>
): Promise<ActivityLog> {
  const result = await query<ActivityLog>(`
    INSERT INTO "ActivityLog" (
      "userId", action, "entityType", "entityId", details,
      "ipAddress", "userAgent"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [
    data.userId,
    data.action,
    data.entityType,
    data.entityId,
    data.details ? JSON.stringify(data.details) : null,
    data.ipAddress,
    data.userAgent,
  ]);

  return result.rows[0];
}

/**
 * Get recent activity logs (for dashboard)
 * Replaces: prisma.activityLog.findMany() with take and include
 */
export async function findRecentActivityLogs(limit: number = 10): Promise<ActivityLogWithRelations[]> {
  const result = await query(`
    SELECT 
      al.id, al."userId", al.action, al."entityType", al."entityId",
      al.details, al."ipAddress", al."userAgent", al."createdAt",
      json_build_object(
        'id', u.id,
        'firstName', u."firstName",
        'lastName', u."lastName",
        'email', u.email
      ) as user
    FROM "ActivityLog" al
    LEFT JOIN "User" u ON al."userId" = u.id
    ORDER BY al."createdAt" DESC
    LIMIT $1
  `, [limit]);

  return result.rows.map((row: any) => ({
    id: row.id,
    userId: row.userId,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    details: row.details,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
    user: row.user,
  }));
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

export interface BlogStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  disabled: number;
}

export interface NewsletterStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  disabled: number;
}

/**
 * Get blog statistics grouped by status
 * Replaces: prisma.blog.groupBy()
 */
export async function getBlogStats(): Promise<BlogStats> {
  const result = await query<{ status: ContentStatus; count: string }>(`
    SELECT status, COUNT(*)::text as count
    FROM "Blog"
    GROUP BY status
  `);

  const stats: BlogStats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    disabled: 0,
  };

  result.rows.forEach((row) => {
    const count = parseInt(row.count, 10);
    stats.total += count;
    if (row.status === 'PENDING') stats.pending = count;
    else if (row.status === 'APPROVED') stats.approved = count;
    else if (row.status === 'REJECTED') stats.rejected = count;
    else if (row.status === 'DISABLED') stats.disabled = count;
  });

  return stats;
}

/**
 * Get newsletter statistics grouped by status
 * Replaces: prisma.newsletter.groupBy()
 */
export async function getNewsletterStats(): Promise<NewsletterStats> {
  const result = await query<{ status: ContentStatus; count: string }>(`
    SELECT status, COUNT(*)::text as count
    FROM "Newsletter"
    GROUP BY status
  `);

  const stats: NewsletterStats = {
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    disabled: 0,
  };

  result.rows.forEach((row) => {
    const count = parseInt(row.count, 10);
    stats.total += count;
    if (row.status === 'PENDING') stats.pending = count;
    else if (row.status === 'APPROVED') stats.approved = count;
    else if (row.status === 'REJECTED') stats.rejected = count;
    else if (row.status === 'DISABLED') stats.disabled = count;
  });

  return stats;
}

