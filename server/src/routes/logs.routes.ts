import { Router } from 'express'
import Joi from 'joi'
import { LogsController } from '../controllers/logs.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validateQuery, validateParams } from '../middleware/validation'

const router = Router()

// All log routes require admin access
router.use(authenticate, requireAdmin)

// Validation schemas
const logsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  action: Joi.string().valid('COPIED', 'MOVED', 'DELETED_RETENTION', 'DELETED_MANUAL').optional(),
  filename: Joi.string().min(1).max(255).optional(),
})

const logParamsSchema = Joi.object({
  id: Joi.string().required(),
})

// Routes
router.get('/', validateQuery(logsQuerySchema), LogsController.getLogs)
router.get('/stats', LogsController.getLogStats)
router.get('/:id', validateParams(logParamsSchema), LogsController.getLogById)

export default router
