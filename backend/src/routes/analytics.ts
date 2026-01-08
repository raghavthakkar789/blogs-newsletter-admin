import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import {
  getBlogStats,
  getNewsletterStats,
  findRecentActivityLogs,
  findActivityLogs,
} from '../db/queries';

const router = Router();

router.use(authenticate);

// Get dashboard analytics
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    // Get blog and newsletter statistics
    const [blogs, newsletters, recentActivity] = await Promise.all([
      getBlogStats(),
      getNewsletterStats(),
      findRecentActivityLogs(10),
    ]);
    
    res.json({
      blogs,
      newsletters,
      recentActivity
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Get activity logs
router.get('/activity-logs', async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.query.userId as string | undefined;
    const action = req.query.action as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    
    const filters: any = {};
    if (userId) {
      filters.userId = userId;
    }
    if (action) {
      filters.action = action;
    }
    if (entityType) {
      filters.entityType = entityType;
    }
    
    const { logs, total } = await findActivityLogs(page, limit, filters);
    
    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;
