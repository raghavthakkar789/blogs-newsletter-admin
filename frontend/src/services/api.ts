import api from '../lib/axios';
import { Blog, Newsletter, ActivityLog, DashboardStats } from '../types';

// Blogs
export const blogService = {
  getBlogs: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    createdById?: string;
    search?: string;
  }): Promise<{ blogs: Blog[]; total: number; page: number; totalPages: number }> => {
    // Use authenticated endpoint so status filters and role-based access work for the dashboard
    const response = await api.get('/blogs', { params });
    return response.data;
  },
  getBlog: async (id: string): Promise<{ blog: Blog }> => {
    // Use authenticated endpoint to get blogs with any status (not just APPROVED)
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
    // Use authenticated endpoint so status filters and role-based access work for the dashboard
    const response = await api.get('/newsletters', { params });
    return response.data;
  },
  getNewsletter: async (id: string): Promise<{ newsletter: Newsletter }> => {
    // Use authenticated endpoint to get newsletters with any status (not just APPROVED)
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
  uploadFile: async (file: File, folder: 'blogs' | 'newsletters' = 'blogs'): Promise<{ url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/upload?folder=${folder}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// AI Content Generation - Blog
export const blogContentService = {
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
    const response = await api.post('/generate-blog-content', {
      blogIdea: data.idea,
      blogAbout: data.details || '',
      audience: data.audience || '',
      isCompanySpecific: data.isCompanySpecific || false
    });
    return response.data;
  },
  regenerateBlogField: async (data: {
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
    const response = await api.post('/generate-blog-content/regenerate', data);
    return response.data;
  },
};

// AI Content Generation - Newsletter
export const newsletterContentService = {
  generateNewsletterContent: async (data: {
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
    const response = await api.post('/generate-newsletter-content', {
      newsletterIdea: data.idea,
      newsletterAbout: data.details || '',
      audience: data.audience || '',
      isCompanySpecific: data.isCompanySpecific || false
    });
    return response.data;
  },
  regenerateNewsletterField: async (data: {
    field: 'title' | 'summary' | 'content' | 'category' | 'tags' | 'image';
    prompt: string;
    currentValue?: string;
    context?: {
      title?: string;
      summary?: string;
      content?: string;
      category?: string;
      tags?: string[];
    };
  }): Promise<{
    field: string;
    value: string;
  }> => {
    const response = await api.post('/generate-newsletter-content/regenerate', data);
    return response.data;
  },
};

// Legacy AI Service (for backward compatibility - uses blog endpoints)
export const aiService = {
  generateBlogContent: blogContentService.generateBlogContent,
  regenerateField: blogContentService.regenerateBlogField,
};

