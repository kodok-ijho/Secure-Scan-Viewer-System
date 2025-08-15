import jwt from 'jsonwebtoken'
import { config } from '../config/env'
import { JwtPayload, AuthenticatedUser } from '../types/auth'
import { Role } from '../types/common'

export class JwtService {
  static generateAccessToken(user: AuthenticatedUser): string {
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      type: 'access',
    }

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.tokenExpiresIn,
    } as jwt.SignOptions)
  }

  static generateRefreshToken(user: AuthenticatedUser): string {
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
      type: 'refresh',
    }

    return jwt.sign(payload, config.jwtRefreshSecret, {
      expiresIn: config.refreshExpiresIn,
    } as jwt.SignOptions)
  }

  static verifyAccessToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, config.jwtSecret) as JwtPayload
      if (payload.type !== 'access') {
        throw new Error('Invalid token type')
      }
      return payload
    } catch (error) {
      throw new Error('Invalid access token')
    }
  }

  static verifyRefreshToken(token: string): JwtPayload {
    try {
      const payload = jwt.verify(token, config.jwtRefreshSecret) as JwtPayload
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type')
      }
      return payload
    } catch (error) {
      throw new Error('Invalid refresh token')
    }
  }
}

// In-memory blacklist for refresh tokens (simple implementation)
// In production, consider using Redis or database
export class TokenBlacklist {
  private static blacklistedTokens = new Set<string>()

  static add(token: string): void {
    this.blacklistedTokens.add(token)
  }

  static isBlacklisted(token: string): boolean {
    return this.blacklistedTokens.has(token)
  }

  static clear(): void {
    this.blacklistedTokens.clear()
  }
}
