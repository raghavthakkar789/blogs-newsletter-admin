import api from '../lib/axios';
import { User, Blog, Newsletter, ActivityLog, DashboardStats } from '../types';

// Auth
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'ADMIN' | 'MARKETING_MANAGER';
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  logout: async () => {
    await api.post('/auth/logout');
    localStorage.removeItem('accessToken');
  },
  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },
  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
  updateProfile: async (data: {
    firstName: string;
    lastName: string;
    email: string;
  }): Promise<{ user: User }> => {
    const response = await api.patch('/auth/profile', data);
    return response.data;
  },
};

// Users (Admin only)
export const userService = {
  getUsers: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<{ users: User[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  getUser: async (id: string): Promise<{ user: User }> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  createUser: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'MARKETING_MANAGER';
  }): Promise<{ user: User }> => {
    const response = await api.post('/users', data);
    return response.data;
  },
  updateUser: async (id: string, data: {
    firstName?: string;
    lastName?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    role?: 'ADMIN' | 'MARKETING_MANAGER';
  }): Promise<{ user: User }> => {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  resetUserPassword: async (id: string): Promise<{ temporaryPassword: string }> => {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data;
  },
};

// Blogs
export const blogService = {
  getBlogs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    createdById?: string;
    search?: string;
  }): Promise<{ blogs: Blog[]; total: number; page: number; totalPages: number }> => {
    // Use authenticated internal endpoint so status filters and role-based access work for the dashboard
    const response = await api.get('/blogs/admin/internal', { params });
    return response.data;
  },
  getBlog: async (id: string): Promise<{ blog: Blog }> => {
    const response = await api.get(`/blogs/${id}`);
    return response.data;
  },
  createBlog: async (data: {
    title: string;
    content: string;
    summary?: string;
    category?: string;
    tags?: string[];
    author?: string;
    image?: string;
  }): Promise<{ blog: Blog }> => {
    const response = await api.post('/blogs', data);
    return response.data;
  },
  updateBlog: async (id: string, data: {
    title?: string;
    content?: string;
    summary?: string;
    category?: string;
    tags?: string[];
    author?: string;
    image?: string;
  }): Promise<{ blog: Blog }> => {
    const response = await api.patch(`/blogs/${id}`, data);
    return response.data;
  },
  deleteBlog: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/blogs/${id}`);
    return response.data;
  },
  updateBlogStatus: async (id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED'): Promise<{ blog: Blog }> => {
    const response = await api.patch(`/blogs/${id}/status`, { status });
    return response.data;
  },
  bulkUpdateBlogStatus: async (
    ids: string[],
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<{ updatedCount: number }> => {
    const response = await api.patch('/blogs/bulk/status', { ids, status });
    return response.data;
  },
};

// Newsletters
export const newsletterService = {
  getNewsletters: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    createdById?: string;
    search?: string;
  }): Promise<{ newsletters: Newsletter[]; total: number; page: number; totalPages: number }> => {
    // Use authenticated internal endpoint so status filters and role-based access work for the dashboard
    const response = await api.get('/newsletters/admin/internal', { params });
    return response.data;
  },
  getNewsletter: async (id: string): Promise<{ newsletter: Newsletter }> => {
    const response = await api.get(`/newsletters/${id}`);
    return response.data;
  },
  createNewsletter: async (data: {
    title: string;
    content: string;
    summary?: string;
    category?: string;
    tags?: string[];
    image?: string;
  }): Promise<{ newsletter: Newsletter }> => {
    const response = await api.post('/newsletters', data);
    return response.data;
  },
  updateNewsletter: async (id: string, data: {
    title?: string;
    content?: string;
    summary?: string;
    category?: string;
    tags?: string[];
    image?: string;
  }): Promise<{ newsletter: Newsletter }> => {
    const response = await api.patch(`/newsletters/${id}`, data);
    return response.data;
  },
  deleteNewsletter: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/newsletters/${id}`);
    return response.data;
  },
  updateNewsletterStatus: async (id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED'): Promise<{ newsletter: Newsletter }> => {
    const response = await api.patch(`/newsletters/${id}/status`, { status });
    return response.data;
  },
  bulkUpdateNewsletterStatus: async (
    ids: string[],
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<{ updatedCount: number }> => {
    const response = await api.patch('/newsletters/bulk/status', { ids, status });
    return response.data;
  },
};

// Analytics
export const analyticsService = {
  getDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },
  getActivityLogs: async (params?: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ logs: ActivityLog[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get('/analytics/activity-logs', { params });
    return response.data;
  },
};

// Upload
export const uploadService = {
  uploadFile: async (file: File): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// AI Content Generation
export const aiService = {
  generateBlogContent: async (data: {
    idea: string;
    details?: string;
    audience?: string;
    isCompanySpecific?: boolean;
  }): Promise<{
    title: string;
    content: string;
    summary: string;
    tags?: string[];
  }> => {
    const response = await api.post('/generate-content', {
      blogIdea: data.idea,
      blogAbout: data.details || '',
      audience: data.audience || '',
      isCompanySpecific: data.isCompanySpecific || false
    });
    return response.data;
  },
  regenerateField: async (data: {
    field: 'title' | 'summary' | 'content' | 'category' | 'tags' | 'author' | 'image';
    prompt: string;
    currentValue?: string;
    context?: {
      title?: string;
      summary?: string;
      content?: string;
      category?: string;
      tags?: string[];
      author?: string;
    };
  }): Promise<{
    field: string;
    value: string;
  }> => {
    const response = await api.post('/generate-content/regenerate', data);
    return response.data;
  },
};

export const generateContentService = {
  generateContent: async (blogIdea: string, blogAbout: string): Promise<{
    title: string;
    content: string;
    summary: string;
  }> => {
    const response = await api.post('/generate-content', { blogIdea, blogAbout });
    return response.data;
  },
};

