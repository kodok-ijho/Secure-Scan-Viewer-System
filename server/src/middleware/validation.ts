import { Request, Response, NextFunction } from 'express'
import Joi from 'joi'

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body)
    if (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(detail => detail.message),
      })
      return
    }
    next()
  }
}

export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query)
    if (error) {
      res.status(400).json({
        error: 'Query validation failed',
        details: error.details.map(detail => detail.message),
      })
      return
    }
    next()
  }
}

export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params)
    if (error) {
      res.status(400).json({
        error: 'Parameter validation failed',
        details: error.details.map(detail => detail.message),
      })
      return
    }
    next()
  }
}
