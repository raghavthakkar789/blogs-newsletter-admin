import { Blog, Newsletter } from '@prisma/client';

type AccessUser = {
  id: string;
  role: 'ADMIN' | 'MARKETING_MANAGER';
};

export const canAccessBlog = (user: AccessUser, blog: Blog): boolean => {
  // Both ADMIN and MARKETING_MANAGER can access all blogs
  return user.role === 'ADMIN' || user.role === 'MARKETING_MANAGER';
};

export const canEditBlog = (user: AccessUser, blog: Blog): boolean => {
  // Both ADMIN and MARKETING_MANAGER can edit all blogs regardless of status (PENDING, APPROVED, etc.)
  return user.role === 'ADMIN' || user.role === 'MARKETING_MANAGER';
};

export const canDeleteBlog = (user: AccessUser, blog: Blog): boolean => {
  return user.role === 'ADMIN';
};

export const canApproveContent = (user: AccessUser): boolean => {
  return user.role === 'ADMIN';
};

export const canAccessNewsletter = (user: AccessUser, newsletter: Newsletter): boolean => {
  // Both ADMIN and MARKETING_MANAGER can access all newsletters
  return user.role === 'ADMIN' || user.role === 'MARKETING_MANAGER';
};

export const canEditNewsletter = (user: AccessUser, newsletter: Newsletter): boolean => {
  // Both ADMIN and MARKETING_MANAGER can edit all newsletters regardless of status (PENDING, APPROVED, etc.)
  return user.role === 'ADMIN' || user.role === 'MARKETING_MANAGER';
};

export const canDeleteNewsletter = (user: AccessUser, newsletter: Newsletter): boolean => {
  return user.role === 'ADMIN';
};

