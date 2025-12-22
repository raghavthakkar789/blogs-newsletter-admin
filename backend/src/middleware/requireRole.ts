import { Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { AuthRequest } from './authenticate';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Forbidden: Insufficient permissions' 
      });
    }

    next();
  };
};

