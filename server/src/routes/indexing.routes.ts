import { Router } from 'express'
import Joi from 'joi'
import { IndexingController } from '../controllers/indexing.controller'
import { authenticate, requireAdmin } from '../middleware/auth'
import { validate } from '../middleware/validation'

const router = Router()

// All indexing routes require admin access
router.use(authenticate, requireAdmin)

// Validation schemas
const indexSchema = Joi.object({
  mode: Joi.string().valid('COPY', 'MOVE').required(),
})

// Routes
router.post('/', validate(indexSchema), IndexingController.indexFiles)

export default router
