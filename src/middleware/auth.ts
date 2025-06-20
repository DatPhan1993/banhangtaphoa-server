import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../types';
import { config } from '../config';

const JWT_SECRET = config.JWT_SECRET;

export interface AuthRequest extends Request {
  user?: Omit<User, 'password_hash'>;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired token' 
      });
    }

    req.user = decoded as Omit<User, 'password_hash'>;
    next();
  });
};

export const authorizeRoles = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        error: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Alias for authorizeRoles to match the usage in routes
export const authorize = authorizeRoles;

export const generateToken = (user: Omit<User, 'password_hash'>): string => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}; 