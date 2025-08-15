import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { LoginRequest, RefreshRequest } from '../types/auth'

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const loginData: LoginRequest = req.body
      const result = await AuthService.login(loginData)
      
      res.json(result)
    } catch (error) {
      res.status(401).json({
        error: error instanceof Error ? error.message : 'Login failed',
      })
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const refreshData: RefreshRequest = req.body
      const result = await AuthService.refresh(refreshData)
      
      res.json(result)
    } catch (error) {
      res.status(401).json({
        error: error instanceof Error ? error.message : 'Token refresh failed',
      })
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body
      
      if (refreshToken) {
        await AuthService.logout(refreshToken)
      }
      
      res.json({ message: 'Logged out successfully' })
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Logout failed',
      })
    }
  }
}
