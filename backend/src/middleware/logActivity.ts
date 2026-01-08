import { Response, NextFunction } from 'express';
import { createActivityLog } from '../db/queries';
import { AuthRequest } from './authenticate';
import { getAdminUserId } from '../utils/adminUser';

export const logActivity = (action: string, entityType?: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json;
    
    res.json = function(data: any) {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        // Use admin user ID for activity logs
        getAdminUserId().then(adminId => {
          createActivityLog({
            userId: adminId,
            action,
            entityType: entityType || null,
            entityId: req.params.id || data?.id || null,
            details: {
              method: req.method,
              path: req.path,
              body: req.body
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent') || null
          }).catch(console.error);
        }).catch(console.error);
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
};
