import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { logActivity } from '../middleware/logActivity';
import { requireRole } from '../middleware/requireRole';
import { canAccessBlog, canEditBlog, canDeleteBlog } from '../utils/accessControl';

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

// Public GET: list approved blogs (SEO/public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string | undefined;
    
    const where: any = {
      status: 'APPROVED'
    };
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.blog.count({ where })
    ]);
    
    res.json({
      blogs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Public GET: single approved blog
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const blog = await prisma.blog.findFirst({
      where: { id: req.params.id, status: 'APPROVED' }
    });
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    res.json({ blog });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
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
    
    const where: any = {};
    
    // Access control: MARKETING_MANAGER sees own + approved, ADMIN sees all
    if (req.user!.role === 'MARKETING_MANAGER') {
      where.OR = [
        { createdById: req.user!.id },
        { status: 'APPROVED' }
      ];
    }
    
    if (status) {
      if (req.user!.role === 'MARKETING_MANAGER') {
        // Marketing managers can filter by status only for their own blogs
        where.AND = [
          { createdById: req.user!.id },
          { status }
        ];
      } else {
        where.status = status;
      }
    }
    
    if (createdById) {
      if (req.user!.role === 'MARKETING_MANAGER' && createdById !== req.user!.id) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      where.createdById = createdById;
    }
    
    if (search) {
      where.OR = [
        ...(where.OR || []),
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          approvedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.blog.count({ where })
    ]);
    
    res.json({
      blogs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Authenticated GET: single blog with access control
router.get('/admin/internal/:id', async (req: AuthRequest, res: Response) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    if (!canAccessBlog(req.user!, blog)) {
      return res.status(403).json({ message: 'Forbidden' });
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
    
    const blog = await prisma.blog.create({
      data: {
        ...data,
        image: data.image || null,
        createdById: req.user!.id,
        status: 'PENDING'
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });
    
    res.status(201).json({ blog });
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
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id }
    });
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    if (!canEditBlog(req.user!, blog)) {
      return res.status(403).json({ message: 'Forbidden: Cannot edit this blog' });
    }
    
    const data = blogSchema.partial().parse(req.body);
    
    const updatedBlog = await prisma.blog.update({
      where: { id: req.params.id },
      data: {
        ...data,
        image: data.image === '' ? null : data.image
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    res.json({ blog: updatedBlog });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Delete blog (Admin only)
router.delete('/:id', requireRole('ADMIN'), logActivity('DELETE_BLOG', 'Blog'), async (req: AuthRequest, res: Response) => {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id }
    });
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    await prisma.blog.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Blog deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update blog status (Admin only)
router.patch('/:id/status', requireRole('ADMIN'), logActivity('UPDATE_BLOG_STATUS', 'Blog'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = statusSchema.parse(req.body);
    
    const blog = await prisma.blog.findUnique({
      where: { id: req.params.id }
    });
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    const updateData: any = {
      status,
      // keep original approver for DISABLED content so history is preserved
      approvedById: status === 'APPROVED' ? req.user!.id : blog.approvedById
    };
    
    if (status === 'APPROVED' && !blog.publishedAt) {
      updateData.publishedAt = new Date();
    }
    
    const updatedBlog = await prisma.blog.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    res.json({ blog: updatedBlog });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Bulk update blog status (Admin only)
router.patch('/bulk/status', requireRole('ADMIN'), logActivity('BULK_UPDATE_BLOG_STATUS', 'Blog'), async (req: AuthRequest, res: Response) => {
  try {
    const bodySchema = z.object({
      ids: z.array(z.string().uuid()).min(1, 'At least one blog id is required'),
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED'])
    });

    const { ids, status } = bodySchema.parse(req.body);

    const updateData: any = {
      status,
      approvedById: status === 'APPROVED' ? req.user!.id : null
    };

    if (status === 'APPROVED') {
      updateData.publishedAt = new Date();
    } else {
      updateData.publishedAt = null;
    }

    const result = await prisma.blog.updateMany({
      where: { id: { in: ids } },
      data: updateData
    });

    res.json({
      updatedCount: result.count
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;

