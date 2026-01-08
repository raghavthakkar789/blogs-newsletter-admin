import { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { logActivity } from '../middleware/logActivity';
import { getAdminUserId } from '../utils/adminUser';
import {
  findNewsletters,
  findNewsletterById,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
  bulkUpdateNewsletterStatus,
} from '../db/queries';

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
    
    const { newsletters, total } = await findNewsletters(page, limit, filters);
    
    res.json({
      newsletters,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('Error fetching newsletters:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Authenticated GET: single newsletter with access control
router.get('/admin/internal/:id', async (req: AuthRequest, res: Response) => {
  try {
    const newsletter = await findNewsletterById(req.params.id);
    
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
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
    const adminId = await getAdminUserId();
    
    const newsletter = await createNewsletter({
      ...data,
      tags: data.tags || [],
      image: data.image || null,
      createdById: adminId,
      status: 'PENDING',
      summary: data.summary || null,
      category: data.category || null,
      approvedById: null,
      publishedAt: null,
      editHistory: null,
      lastEditedAt: null,
      lastEditedBy: null,
    });
    
    // Fetch with relations for response
    const newsletterWithRelations = await findNewsletterById(newsletter.id);
    
    res.status(201).json({ newsletter: newsletterWithRelations });
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
    const newsletter = await findNewsletterById(req.params.id);
    
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
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
    
    await updateNewsletter(req.params.id, updateData);
    
    // Fetch updated newsletter with relations
    const updatedNewsletter = await findNewsletterById(req.params.id);
    
    res.json({ newsletter: updatedNewsletter });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Delete newsletter
router.delete('/:id', logActivity('DELETE_NEWSLETTER', 'Newsletter'), async (req: AuthRequest, res: Response) => {
  try {
    const newsletter = await findNewsletterById(req.params.id);
    
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    
    await deleteNewsletter(req.params.id);
    
    res.json({ message: 'Newsletter deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Update newsletter status
router.patch('/:id/status', logActivity('UPDATE_NEWSLETTER_STATUS', 'Newsletter'), async (req: AuthRequest, res: Response) => {
  try {
    const { status } = statusSchema.parse(req.body);
    
    const newsletter = await findNewsletterById(req.params.id);
    
    if (!newsletter) {
      return res.status(404).json({ message: 'Newsletter not found' });
    }
    
    const updateData: any = {
      status,
      approvedById: status === 'APPROVED' ? await getAdminUserId() : newsletter.approvedById
    };
    
    if (status === 'APPROVED' && !newsletter.publishedAt) {
      updateData.publishedAt = new Date();
    }
    
    await updateNewsletter(req.params.id, updateData);
    
    // Fetch updated newsletter with relations
    const updatedNewsletter = await findNewsletterById(req.params.id);
    
    res.json({ newsletter: updatedNewsletter });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Bulk update newsletter status
router.patch('/bulk/status', logActivity('BULK_UPDATE_NEWSLETTER_STATUS', 'Newsletter'), async (req: AuthRequest, res: Response) => {
  try {
    const bodySchema = z.object({
      ids: z.array(z.string().uuid()).min(1, 'At least one newsletter id is required'),
      status: z.enum(['PENDING', 'APPROVED', 'REJECTED'])
    });

    const { ids, status } = bodySchema.parse(req.body);

    const approvedById = status === 'APPROVED' ? await getAdminUserId() : null;
    const publishedAt = status === 'APPROVED' ? new Date() : null;

    const updatedCount = await bulkUpdateNewsletterStatus(ids, status, approvedById, publishedAt);

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
