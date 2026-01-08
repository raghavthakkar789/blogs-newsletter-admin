import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { logActivity } from '../middleware/logActivity';
import { getAdminUserId } from '../utils/adminUser';
import {
  findBlogs,
  findBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  bulkUpdateBlogStatus,
} from '../db/queries';

const router = Router();

const blogSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().max(500, 'Summary must be less than 500 characters').optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal(''))
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DISABLED'])
});

// Authenticated routes for admin/marketing UI
router.use(authenticate);

// Authenticated GET: full blogs listing with role-based access
router.get('/admin/internal', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const createdById = req.query.createdById as string | undefined;
    const search = req.query.search as string | undefined;
    
    const filters: any = {};
    if (status && status !== 'all') {
      filters.status = status as any;
    }
    if (createdById) {
      filters.createdById = createdById;
    }
    if (search) {
      filters.search = search;
    }
    
    const { blogs, total } = await findBlogs(page, limit, filters);
    
    res.json({
      blogs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Authenticated GET: single blog with access control
router.get('/admin/internal/:id', async (req: AuthRequest, res: Response) => {
  try {
    const blog = await findBlogById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    res.json({ blog });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Create blog
router.post('/', logActivity('CREATE_BLOG', 'Blog'), async (req: AuthRequest, res: Response) => {
  try {
    const data = blogSchema.parse(req.body);
    const adminId = await getAdminUserId();
    
    const blog = await createBlog({
      ...data,
      tags: data.tags || [],
      image: data.image || null,
      createdById: adminId,
      status: 'PENDING',
      summary: data.summary || null,
      category: data.category || null,
      author: data.author || null,
      approvedById: null,
      publishedAt: null,
      editHistory: null,
      lastEditedAt: null,
      lastEditedBy: null,
    });
    
    // Fetch with relations for response
    const blogWithRelations = await findBlogById(blog.id);
    
    res.status(201).json({ blog: blogWithRelations });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update blog
router.patch('/:id', logActivity('UPDATE_BLOG', 'Blog'), async (req: AuthRequest, res: Response) => {
  try {
    const blog = await findBlogById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    const data = blogSchema.partial().parse(req.body);
    
    // Track changes for edit history
    const changes: string[] = [];
    const fieldsToCheck = ['title', 'content', 'summary', 'category', 'author', 'image', 'tags'];
    
    fieldsToCheck.forEach(field => {
      if (field === 'tags') {
        const oldTags = JSON.stringify(blog.tags || []);
        const newTags = JSON.stringify(data.tags || []);
        if (oldTags !== newTags) {
          changes.push(field);
        }
      } else if (data[field as keyof typeof data] !== undefined && 
                 data[field as keyof typeof data] !== blog[field as keyof typeof blog]) {
        changes.push(field);
      }
    });
    
    // Build edit history entry
    const userName = `${req.user!.firstName} ${req.user!.lastName}`;
    const editEntry = {
      userId: req.user!.id,
      userName,
      editedAt: new Date().toISOString(),
      changes
    };
    
    // Get existing edit history
    const existingHistory = (blog.editHistory as any[]) || [];
    const updatedHistory = [...existingHistory, editEntry];
    
    // Prepare update data
    const updateData: any = {
      ...data,
      image: data.image === '' ? null : data.image,
      lastEditedBy: userName,
      lastEditedAt: new Date(),
      editHistory: updatedHistory
    };
    
    await updateBlog(req.params.id, updateData);
    
    // Fetch updated blog with relations
    const updatedBlog = await findBlogById(req.params.id);
    
    res.json({ blog: updatedBlog });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Delete blog
router.delete('/:id', logActivity('DELETE_BLOG', 'Blog'), async (req: AuthRequest, res: Response) => {
  try {
    const blog = await findBlogById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    await deleteBlog(req.params.id);
    
    res.json({ message: 'Blog deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update blog status
router.patch('/:id/status', logActivity('UPDATE_BLOG_STATUS', 'Blog'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = statusSchema.parse(req.body);
    
    const blog = await findBlogById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    const updateData: any = {
      status,
      approvedById: status === 'APPROVED' ? await getAdminUserId() : blog.approvedById
    };
    
    if (status === 'APPROVED' && !blog.publishedAt) {
      updateData.publishedAt = new Date();
    }
    
    await updateBlog(req.params.id, updateData);
    
    // Fetch updated blog with relations
    const updatedBlog = await findBlogById(req.params.id);
    
    res.json({ blog: updatedBlog });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Bulk update blog status
router.patch('/bulk/status', logActivity('BULK_UPDATE_BLOG_STATUS', 'Blog'), async (req: AuthRequest, res: Response) => {
  try {
    const bodySchema = z.object({
      ids: z.array(z.string().uuid()).min(1, 'At least one blog id is required'),
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED'])
    });

    const { ids, status } = bodySchema.parse(req.body);

    const approvedById = status === 'APPROVED' ? await getAdminUserId() : null;
    const publishedAt = status === 'APPROVED' ? new Date() : null;

    const updatedCount = await bulkUpdateBlogStatus(ids, status, approvedById, publishedAt);

    res.json({
      updatedCount
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;
