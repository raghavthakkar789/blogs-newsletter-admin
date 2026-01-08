import { Request, Response, NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

// Simple authentication using hardcoded admin token from env
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    
    // Get admin token from environment
    const adminToken = process.env.ADMIN_TOKEN || 'admin-token';
    
    if (!token || token !== adminToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Set hardcoded admin user from env
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
    const adminName = process.env.ADMIN_NAME || 'Admin User';
    const nameParts = adminName.split(' ');
    
    req.user = {
      id: 'admin',
      email: adminEmail,
      firstName: nameParts[0] || 'Admin',
      lastName: nameParts.slice(1).join(' ') || 'User'
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

