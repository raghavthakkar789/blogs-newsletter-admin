import { Router, Response, Request } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { logActivity } from '../middleware/logActivity';
import { requireRole } from '../middleware/requireRole';
import { canAccessNewsletter, canEditNewsletter, canDeleteNewsletter } from '../utils/accessControl';

const router = Router();

const newsletterSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().max(500, 'Summary must be less than 500 characters').optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  image: z.string().url('Invalid image URL').optional().or(z.literal(''))
});

const statusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'DISABLED'])
});

// Public GET: list approved newsletters
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
    
    const [newsletters, total] = await Promise.all([
      prisma.newsletter.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.newsletter.count({ where })
    ]);
    
    res.json({
      newsletters,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Public GET: single approved newsletter
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const newsletter = await prisma.newsletter.findFirst({
      where: { id: req.params.id, status: 'APPROVED' }
    });
    
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    
    res.json({ newsletter });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Authenticated routes for admin/marketing UI
router.use(authenticate);

// Authenticated GET: full newsletters listing with role-based access
router.get('/admin/internal', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string | undefined;
    const createdById = req.query.createdById as string | undefined;
    const search = req.query.search as string | undefined;
    
    const where: any = {};
    const andConditions: any[] = [];
    
    // Both ADMIN and MARKETING_MANAGER can see all newsletters
    // Apply filters normally
    if (status && status !== 'all') {
      andConditions.push({ status });
    }
    
    if (createdById) {
      andConditions.push({ createdById });
    }
    
    if (search) {
      andConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { summary: { contains: search, mode: 'insensitive' } }
        ]
      });
    }
    
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
    
    console.log('Newsletters query where clause:', JSON.stringify(where, null, 2));
    
    const [newsletters, total] = await Promise.all([
      prisma.newsletter.findMany({
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
        orderBy: { updatedAt: 'desc' }
      }),
      prisma.newsletter.count({ where })
    ]);
    
    res.json({
      newsletters,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('Error fetching newsletters:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Authenticated GET: single newsletter with access control
router.get('/admin/internal/:id', async (req: AuthRequest, res: Response) => {
  try {
    const newsletter = await prisma.newsletter.findUnique({
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
    
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    
    if (!canAccessNewsletter(req.user!, newsletter)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    
    res.json({ newsletter });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Create newsletter
router.post('/', logActivity('CREATE_NEWSLETTER', 'Newsletter'), async (req: AuthRequest, res: Response) => {
  try {
    const data = newsletterSchema.parse(req.body);
    
    const newsletter = await prisma.newsletter.create({
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
    
    res.status(201).json({ newsletter });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update newsletter
router.patch('/:id', logActivity('UPDATE_NEWSLETTER', 'Newsletter'), async (req: AuthRequest, res: Response) => {
  try {
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: req.params.id }
    });
    
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    
    if (!canEditNewsletter(req.user!, newsletter)) {
      return res.status(403).json({ message: 'Forbidden: Cannot edit this newsletter' });
    }
    
    const data = newsletterSchema.partial().parse(req.body);
    
    // Track changes for edit history
    const changes: string[] = [];
    const fieldsToCheck = ['title', 'content', 'summary', 'category', 'image', 'tags'];
    
    fieldsToCheck.forEach(field => {
      if (field === 'tags') {
        const oldTags = JSON.stringify(newsletter.tags || []);
        const newTags = JSON.stringify(data.tags || []);
        if (oldTags !== newTags) {
          changes.push(field);
        }
      } else if (data[field as keyof typeof data] !== undefined && 
                 data[field as keyof typeof data] !== newsletter[field as keyof typeof newsletter]) {
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
    const existingHistory = (newsletter.editHistory as any[]) || [];
    const updatedHistory = [...existingHistory, editEntry];
    
    // Prepare update data
    const updateData: any = {
      ...data,
      image: data.image === '' ? null : data.image,
      lastEditedBy: userName,
      lastEditedAt: new Date(),
      editHistory: updatedHistory
    };
    
    const updatedNewsletter = await prisma.newsletter.update({
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
    
    res.json({ newsletter: updatedNewsletter });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Delete newsletter (Admin only)
router.delete('/:id', requireRole('ADMIN'), logActivity('DELETE_NEWSLETTER', 'Newsletter'), async (req: AuthRequest, res: Response) => {
  try {
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: req.params.id }
    });
    
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    
    await prisma.newsletter.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'Newsletter deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update newsletter status (Admin only)
router.patch('/:id/status', requireRole('ADMIN'), logActivity('UPDATE_NEWSLETTER_STATUS', 'Newsletter'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = statusSchema.parse(req.body);
    
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: req.params.id }
    });
    
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    
    const updateData: any = {
      status,
      approvedById: status === 'APPROVED' ? req.user!.id : newsletter.approvedById
    };
    
    if (status === 'APPROVED' && !newsletter.publishedAt) {
      updateData.publishedAt = new Date();
    }
    
    const updatedNewsletter = await prisma.newsletter.update({
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
    
    res.json({ newsletter: updatedNewsletter });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Bulk update newsletter status (Admin only)
router.patch('/bulk/status', requireRole('ADMIN'), logActivity('BULK_UPDATE_NEWSLETTER_STATUS', 'Newsletter'), async (req: AuthRequest, res: Response) => {
  try {
    const bodySchema = z.object({
      ids: z.array(z.string().uuid()).min(1, 'At least one newsletter id is required'),
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

    const result = await prisma.newsletter.updateMany({
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
