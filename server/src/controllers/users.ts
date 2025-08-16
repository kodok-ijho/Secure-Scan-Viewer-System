import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../lib/database';

export async function listUsers(req: AuthenticatedRequest, res: Response) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(users);
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
}

export async function createUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { username, password, role } = req.body;
    
    if (!username || !password || !role) {
      return res.status(400).json({ error: 'Username, password, and role are required' });
    }
    
    if (!['ADMIN', 'USER'].includes(role)) {
      return res.status(400).json({ error: 'Role must be ADMIN or USER' });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash: password, // In production, this should be hashed
        role: role as 'ADMIN' | 'USER'
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });
    
    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

export async function updateUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { username, role } = req.body;
    
    const updateData: any = {};
    if (username !== undefined) updateData.username = username;
    if (role !== undefined) {
      if (!['ADMIN', 'USER'].includes(role)) {
        return res.status(400).json({ error: 'Role must be ADMIN or USER' });
      }
      updateData.role = role;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

export async function changePassword(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    await prisma.user.update({
      where: { id },
      data: { passwordHash: password } // In production, this should be hashed
    });
    
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
}

export async function deleteUser(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    
    // Prevent deleting the current user
    if (req.user?.id === id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id }
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}
