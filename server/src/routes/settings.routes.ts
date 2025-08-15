import { Router } from 'express'
import Joi from 'joi'
import { SettingsController } from '../controllers/settings.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validation'

const router = Router()

// All settings routes require admin access
router.use(authenticate, requireAdmin)

// Validation schemas
const updateSettingsSchema = Joi.object({
  sourceFolder: Joi.string().min(1).max(500).optional(),
  retentionDays: Joi.number().integer().min(1).max(365).optional(),
})

const testAccessSchema = Joi.object({
  sourceFolder: Joi.string().min(1).max(500).optional(),
})

// Routes
router.get('/', SettingsController.getSettings)
router.patch('/', validate(updateSettingsSchema), SettingsController.updateSettings)
router.post('/test-access', validate(testAccessSchema), SettingsController.testAccess)

export default router
