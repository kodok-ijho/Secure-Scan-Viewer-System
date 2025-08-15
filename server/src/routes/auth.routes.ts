import { Router } from 'express'
import Joi from 'joi'
import { AuthController } from '../controllers/auth.controller'
import { validate } from '../middleware/validation'
import rateLimit from 'express-rate-limit'

const router = Router()

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Validation schemas
const loginSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(6).required(),
})

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
})

const logoutSchema = Joi.object({
  refreshToken: Joi.string().optional(),
})

// Routes
router.post('/login', authLimiter, validate(loginSchema), AuthController.login)
router.post('/refresh', validate(refreshSchema), AuthController.refresh)
router.post('/logout', validate(logoutSchema), AuthController.logout)

export default router
