import { Request, Response, NextFunction } from 'express'
import { JwtService } from '../utils/jwt'
import { AuthenticatedUser } from '../types/auth'
import { Role } from '../types/common'

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Try to get token from Authorization header first
    let token: string | undefined
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7) // Remove 'Bearer ' prefix
    } else if (req.query.token && typeof req.query.token === 'string') {
      // Fallback to query parameter for stream endpoints
      token = req.query.token
    }

    if (!token) {
      res.status(401).json({ error: 'Access token required' })
      return
    }

    const payload = JwtService.verifyAccessToken(token)

    req.user = {
      id: payload.userId,
      username: payload.username,
      role: payload.role,
    }

    next()
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export const requireRole = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    next()
  }
}

export const requireAdmin = requireRole(['ADMIN'])
export const requireUser = requireRole(['USER', 'ADMIN'])
