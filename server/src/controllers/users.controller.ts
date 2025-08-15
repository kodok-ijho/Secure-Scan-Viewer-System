import { Request, Response } from 'express'
import { UsersService } from '../services/users.service'

export class UsersController {
  static async listUsers(req: Request, res: Response) {
    try {
      const users = await UsersService.listUsers()
      res.json(users)
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to list users',
      })
    }
  }

  static async createUser(req: Request, res: Response) {
    try {
      const user = await UsersService.createUser(req.body)
      res.status(201).json(user)
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to create user',
      })
    }
  }

  static async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params
      const user = await UsersService.getUserById(id)

      if (!user) {
        res.status(404).json({ error: 'User not found' })
        return
      }

      res.json(user)
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get user',
      })
    }
  }

  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params
      const user = await UsersService.updateUser(id, req.body)
      res.json(user)
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to update user',
      })
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params
      await UsersService.deleteUser(id)
      res.json({ message: 'User deleted successfully' })
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : 'Failed to delete user',
      })
    }
  }
}
