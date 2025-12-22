import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from './authenticate';

export const logActivity = (action: string, entityType?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
        prisma.activityLog.create({
          data: {
            userId: req.user.id,
            action,
            entityType: entityType || null,
            entityId: req.params.id || data?.id || null,
            details: {
              method: req.method,
              path: req.path,
              body: req.body
            } as any,
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || null
          }
        }).catch(console.error);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};

