import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthenticatedRequest extends Request {
  user?: jwt.JwtPayload | string
}

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const token = header.slice(7)
  const secret = process.env.JWT_SECRET

  if (!secret) {
    res.status(500).json({ message: 'JWT_SECRET is not defined' })
    return
  }

  try {
    const decoded = jwt.verify(token, secret)
    ;(req as AuthenticatedRequest).user = decoded
    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}
