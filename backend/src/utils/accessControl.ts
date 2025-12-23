import { Blog, Newsletter } from '@prisma/client';

type AccessUser = {
  id: string;
  role: 'ADMIN' | 'MARKETING_MANAGER';
};

export const canAccessBlog = (user: AccessUser, blog: Blog): boolean => {
  if (user.role === 'ADMIN') return true;
  
  if (user.role === 'MARKETING_MANAGER') {
    return blog.createdById === user.id || blog.status === 'APPROVED';
  }
  
  return false;
};

export const canEditBlog = (user: AccessUser, blog: Blog): boolean => {
  if (user.role === 'ADMIN') return true;
  
  if (user.role === 'MARKETING_MANAGER') {
    return (
      blog.createdById === user.id &&
      ['PENDING', 'REJECTED'].includes(blog.status)
    );
  }
  
  return false;
};

export const canDeleteBlog = (user: AccessUser, blog: Blog): boolean => {
  return user.role === 'ADMIN';
};

export const canApproveContent = (user: AccessUser): boolean => {
  return user.role === 'ADMIN';
};

export const canAccessNewsletter = (user: AccessUser, newsletter: Newsletter): boolean => {
  if (user.role === 'ADMIN') return true;
  
  if (user.role === 'MARKETING_MANAGER') {
    return newsletter.createdById === user.id || newsletter.status === 'APPROVED';
  }
  
  return false;
};

export const canEditNewsletter = (user: AccessUser, newsletter: Newsletter): boolean => {
  if (user.role === 'ADMIN') return true;
  
  if (user.role === 'MARKETING_MANAGER') {
    return (
      newsletter.createdById === user.id &&
      ['PENDING', 'REJECTED'].includes(newsletter.status)
    );
  }
  
  return false;
};

export const canDeleteNewsletter = (user: AccessUser, newsletter: Newsletter): boolean => {
  return user.role === 'ADMIN';
};

