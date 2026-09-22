import type { NextFunction, Request, RequestHandler, Response } from 'express'

export type ValidationResult = string[] | null | undefined
export type Validator = (body: unknown) => ValidationResult

export const validate = (validator: Validator): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors = validator(req.body)

    if (errors?.length) {
      res.status(400).json({ message: 'Validation failed', errors })
      return
    }

    next()
  }
}

export default validate
