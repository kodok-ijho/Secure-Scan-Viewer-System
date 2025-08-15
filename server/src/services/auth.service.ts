import bcrypt from 'bcryptjs'
import { prisma } from '../config/database'
import { JwtService, TokenBlacklist } from '../utils/jwt'
import { LoginRequest, LoginResponse, RefreshRequest, RefreshResponse } from '../types/auth'
import { Role } from '../types/common'

export class AuthService {
  static async login(data: LoginRequest): Promise<LoginResponse> {
    const { username, password } = data

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user) {
      throw new Error('Invalid credentials')
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      throw new Error('Invalid credentials')
    }

    // Generate tokens
    const userPayload = {
      id: user.id,
      username: user.username,
      role: user.role as Role,
    }

    const accessToken = JwtService.generateAccessToken(userPayload)
    const refreshToken = JwtService.generateRefreshToken(userPayload)

    return {
      accessToken,
      refreshToken,
      user: userPayload,
    }
  }

  static async refresh(data: RefreshRequest): Promise<RefreshResponse> {
    const { refreshToken } = data

    // Check if token is blacklisted
    if (TokenBlacklist.isBlacklisted(refreshToken)) {
      throw new Error('Token has been revoked')
    }

    // Verify refresh token
    const payload = JwtService.verifyRefreshToken(refreshToken)

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Generate new access token
    const userPayload = {
      id: user.id,
      username: user.username,
      role: user.role as Role,
    }

    const accessToken = JwtService.generateAccessToken(userPayload)

    return { accessToken }
  }

  static async logout(refreshToken: string): Promise<void> {
    // Add refresh token to blacklist
    TokenBlacklist.add(refreshToken)
  }

  static async createUser(username: string, password: string, role: Role): Promise<{ id: string; username: string; role: Role }> {
    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    })

    if (existingUser) {
      throw new Error('Username already exists')
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
    })

    return {
      id: user.id,
      username: user.username,
      role: user.role as Role,
    }
  }
}
