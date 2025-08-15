import { prisma } from '../config/database'
import { AuthService } from './auth.service'
import { Role } from '../types/common'

export interface UserInfo {
  id: string
  username: string
  role: Role
  createdAt: Date
}

export interface CreateUserRequest {
  username: string
  password: string
  role: Role
}

export class UsersService {
  static async listUsers(): Promise<UserInfo[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return users.map(user => ({
      ...user,
      role: user.role as Role
    }))
  }

  static async createUser(data: CreateUserRequest): Promise<UserInfo> {
    const user = await AuthService.createUser(data.username, data.password, data.role)
    
    // Fetch the full user info
    const userInfo = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    })

    if (!userInfo) {
      throw new Error('Failed to retrieve created user')
    }

    return {
      ...userInfo,
      role: userInfo.role as Role
    }
  }

  static async getUserById(id: string): Promise<UserInfo | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    })

    return user ? {
      ...user,
      role: user.role as Role
    } : null
  }

  static async deleteUser(id: string): Promise<void> {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new Error('User not found')
    }

    // Prevent deletion of the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      })

      if (adminCount <= 1) {
        throw new Error('Cannot delete the last admin user')
      }
    }

    await prisma.user.delete({
      where: { id },
    })
  }

  static async updateUser(id: string, data: { role?: Role }): Promise<UserInfo> {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    })

    if (!existingUser) {
      throw new Error('User not found')
    }

    // If changing role from admin, ensure there's at least one admin left
    if (existingUser.role === 'ADMIN' && data.role === 'USER') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN' },
      })

      if (adminCount <= 1) {
        throw new Error('Cannot change role of the last admin user')
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    })

    return {
      ...updatedUser,
      role: updatedUser.role as Role
    }
  }
}
