import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { requireRole } from '../middleware/requireRole';

const router = Router();

router.use(authenticate);

// Get dashboard analytics
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const isAdmin = req.user!.role === 'ADMIN';
    
    // Build where clauses based on role
    const blogWhere = isAdmin ? {} : {
      OR: [
        { createdById: userId },
        { status: 'APPROVED' }
      ]
    };
    
    const newsletterWhere = isAdmin ? {} : {
      OR: [
        { createdById: userId },
        { status: 'APPROVED' }
      ]
    };
    
    // Get blog statistics
    const blogStats = await prisma.blog.groupBy({
      by: ['status'],
      where: blogWhere,
      _count: true
    });
    
    // Get newsletter statistics
    const newsletterStats = await prisma.newsletter.groupBy({
      by: ['status'],
      where: newsletterWhere,
      _count: true
    });
    
    // Format blog stats
    const blogs = {
      total: blogStats.reduce((sum, stat) => sum + stat._count, 0),
      pending: blogStats.find(s => s.status === 'PENDING')?._count || 0,
      approved: blogStats.find(s => s.status === 'APPROVED')?._count || 0,
      rejected: blogStats.find(s => s.status === 'REJECTED')?._count || 0,
      disabled: blogStats.find(s => s.status === 'DISABLED')?._count || 0
    };
    
    // Format newsletter stats
    const newsletters = {
      total: newsletterStats.reduce((sum, stat) => sum + stat._count, 0),
      pending: newsletterStats.find(s => s.status === 'PENDING')?._count || 0,
      approved: newsletterStats.find(s => s.status === 'APPROVED')?._count || 0,
      rejected: newsletterStats.find(s => s.status === 'REJECTED')?._count || 0,
      disabled: newsletterStats.find(s => s.status === 'DISABLED')?._count || 0
    };
    
    // Get user stats (Admin only)
    let users = null;
    if (isAdmin) {
      const userCounts = await prisma.user.groupBy({
        by: ['status'],
        _count: true
      });
      
      users = {
        total: userCounts.reduce((sum, stat) => sum + stat._count, 0),
        active: userCounts.find(s => s.status === 'ACTIVE')?._count || 0
      };
    }
    
    // Get recent activity (last 10)
    const recentActivityWhere = isAdmin ? {} : { userId };
    
    const recentActivity = await prisma.activityLog.findMany({
      where: recentActivityWhere,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({
      blogs,
      newsletters,
      users,
      recentActivity
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

// Get activity logs (Admin only)
router.get('/activity-logs', requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.query.userId as string | undefined;
    const action = req.query.action as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    
    const where: any = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (action) {
      where.action = action;
    }
    
    if (entityType) {
      where.entityType = entityType;
    }
    
    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.activityLog.count({ where })
    ]);
    
    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
});

export default router;

