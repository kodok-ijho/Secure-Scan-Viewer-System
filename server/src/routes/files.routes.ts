import { Router } from 'express'
import Joi from 'joi'
import { FilesController } from '../controllers/files.controller'
import { authenticate, requireUser } from '../middleware/auth'
import { validateQuery, validateParams } from '../middleware/validation'

const router = Router()

// All file routes require authentication
router.use(authenticate, requireUser)

// Validation schemas
const listFilesQuerySchema = Joi.object({
  owner: Joi.string().min(1).max(50).optional(),
})

const fileParamsSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
})

// Routes
router.get('/', validateQuery(listFilesQuerySchema), FilesController.listFiles)
router.get('/:name/stream', validateParams(fileParamsSchema), FilesController.streamFile)
router.get('/:name/download', validateParams(fileParamsSchema), FilesController.downloadFile)
router.delete('/:name', validateParams(fileParamsSchema), FilesController.deleteFile)
router.delete('/', FilesController.deleteAllFiles)

export default router
