/**
 * Database Type Definitions
 * 
 * TypeScript interfaces matching the PostgreSQL schema.
 * These replace Prisma-generated types.
 */

// Enums (matching PostgreSQL enum types)
export type Role = 'ADMIN' | 'MARKETING_MANAGER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ContentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';

// User Model
export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  avatar: string | null;
  lastLogin: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Blog Model
export interface Blog {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string | null;
  tags: string[];
  author: string | null;
  image: string | null;
  status: ContentStatus;
  createdById: string;
  approvedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  editHistory: any | null; // JSONB field
  lastEditedAt: Date | null;
  lastEditedBy: string | null;
}

// Newsletter Model
export interface Newsletter {
  id: string;
  title: string;
  content: string;
  summary: string | null;
  category: string | null;
  tags: string[];
  image: string | null;
  status: ContentStatus;
  createdById: string;
  approvedById: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  editHistory: any | null; // JSONB field
  lastEditedAt: Date | null;
  lastEditedBy: string | null;
}

// ActivityLog Model
export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  details: any | null; // JSONB field
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// Extended types with relations (for API responses)
export interface BlogWithRelations extends Blog {
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  approvedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface NewsletterWithRelations extends Newsletter {
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  approvedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface ActivityLogWithRelations extends ActivityLog {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

