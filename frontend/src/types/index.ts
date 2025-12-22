export type Role = 'ADMIN' | 'MARKETING_MANAGER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
export type ContentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  status: UserStatus;
  avatar?: string | null;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt?: string;
  _count?: {
    blogs: number;
    newsletters: number;
  };
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  category?: string | null;
  tags: string[];
  author?: string | null;
  image?: string | null;
  status: ContentStatus;
  createdById: string;
  approvedById?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface Newsletter {
  id: string;
  title: string;
  content: string;
  summary?: string | null;
  category?: string | null;
  tags: string[];
  image?: string | null;
  status: ContentStatus;
  createdById: string;
  approvedById?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface DashboardStats {
  blogs: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    disabled: number;
  };
  newsletters: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    disabled: number;
  };
  users?: {
    total: number;
    active: number;
  } | null;
  recentActivity: ActivityLog[];
}

