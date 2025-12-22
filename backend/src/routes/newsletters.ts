import { Router, Response } from 'express';
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

router.use(authenticate);

// Get all newsletters
router.get('/', async (req: AuthRequest, res: Response) => {
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

// Get newsletter by ID
router.get('/:id', async (req: AuthRequest, res: Response) => {
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
    
    const updatedNewsletter = await prisma.newsletter.update({
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
      approvedById: status === 'APPROVED' ? req.user!.id : null
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

export default router;

