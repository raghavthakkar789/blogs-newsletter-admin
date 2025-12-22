import { User, Blog, Newsletter, ContentStatus } from '@prisma/client';

export const canAccessBlog = (user: User, blog: Blog): boolean => {
  if (user.role === 'ADMIN') return true;
  
  if (user.role === 'MARKETING_MANAGER') {
    return blog.createdById === user.id || blog.status === 'APPROVED';
  }
  
  return false;
};

export const canEditBlog = (user: User, blog: Blog): boolean => {
  if (user.role === 'ADMIN') return true;
  
  if (user.role === 'MARKETING_MANAGER') {
    return (
      blog.createdById === user.id &&
      ['PENDING', 'REJECTED'].includes(blog.status)
    );
  }
  
  return false;
};

export const canDeleteBlog = (user: User, blog: Blog): boolean => {
  return user.role === 'ADMIN';
};

export const canApproveContent = (user: User): boolean => {
  return user.role === 'ADMIN';
};

export const canAccessNewsletter = (user: User, newsletter: Newsletter): boolean => {
  if (user.role === 'ADMIN') return true;
  
  if (user.role === 'MARKETING_MANAGER') {
    return newsletter.createdById === user.id || newsletter.status === 'APPROVED';
  }
  
  return false;
};

export const canEditNewsletter = (user: User, newsletter: Newsletter): boolean => {
  if (user.role === 'ADMIN') return true;
  
  if (user.role === 'MARKETING_MANAGER') {
    return (
      newsletter.createdById === user.id &&
      ['PENDING', 'REJECTED'].includes(newsletter.status)
    );
  }
  
  return false;
};

export const canDeleteNewsletter = (user: User, newsletter: Newsletter): boolean => {
  return user.role === 'ADMIN';
};

