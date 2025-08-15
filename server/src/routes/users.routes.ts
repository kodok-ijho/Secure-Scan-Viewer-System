import { Router } from 'express'
import Joi from 'joi'
import { UsersController } from '../controllers/users.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate, validateParams } from '../middleware/validation'

const router = Router()

// All user routes require admin access
router.use(authenticate, requireAdmin)

// Validation schemas
const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).pattern(/^[a-zA-Z0-9_]+$/).required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('ADMIN', 'USER').required(),
})

const updateUserSchema = Joi.object({
  role: Joi.string().valid('ADMIN', 'USER').optional(),
})

const userParamsSchema = Joi.object({
  id: Joi.string().required(),
})

// Routes
router.get('/', UsersController.listUsers)
router.post('/', validate(createUserSchema), UsersController.createUser)
router.get('/:id', validateParams(userParamsSchema), UsersController.getUser)
router.patch('/:id', validateParams(userParamsSchema), validate(updateUserSchema), UsersController.updateUser)
router.delete('/:id', validateParams(userParamsSchema), UsersController.deleteUser)

export default router
