import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { prisma } from '../lib/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: 'ADMIN' | 'USER';
  };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    // Support query parameter tokens for file operations
    if (!token && req.query.token) {
      token = req.query.token as string;
    }

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    
    const user = await prisma.user.findUnique({
      where: { username: decoded.username },
      select: {
        id: true,
        username: true,
        role: true
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user as { id: string; username: string; role: 'ADMIN' | 'USER' };
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function generateToken(user: { username: string; role: string }): string {
  const secret = process.env.JWT_SECRET || 'fallback-secret';
  return jwt.sign(
    {
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    secret
  );
}
