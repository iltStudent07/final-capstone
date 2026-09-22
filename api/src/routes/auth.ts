import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { validate } from '../middleware/validate.js'

const router = Router()

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const registerValidator = (body: unknown): string[] => {
  const errors: string[] = []

  if (!isObject(body)) {
    return ['Request body is required']
  }

  if (typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long')
  }

  if (typeof body.email !== 'string' || !body.email.includes('@')) {
    errors.push('A valid email is required')
  }

  if (typeof body.password !== 'string' || body.password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }

  return errors
}

const loginValidator = (body: unknown): string[] => {
  const errors: string[] = []

  if (!isObject(body)) {
    return ['Request body is required']
  }

  if (typeof body.email !== 'string' || !body.email.includes('@')) {
    errors.push('A valid email is required')
  }

  if (typeof body.password !== 'string' || body.password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }

  return errors
}

router.post('/register', validate(registerValidator), async (req, res, next) => {
  try {
    const { name, email, password } = req.body as {
      name: string
      email: string
      password: string
    }

    const existingUser = await User.findOne({ email })

    if (existingUser) {
      res.status(409).json({ message: 'User already exists' })
      return
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    })

    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      res.status(500).json({ message: 'JWT_SECRET is not defined' })
      return
    }

    const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    })

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/login', validate(loginValidator), async (req, res, next) => {
  try {
    const { email, password } = req.body as {
      email: string
      password: string
    }

    const user = await User.findOne({ email })

    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const passwordMatch = await bcrypt.compare(password, user.password)

    if (!passwordMatch) {
      res.status(401).json({ message: 'Invalid credentials' })
      return
    }

    const jwtSecret = process.env.JWT_SECRET

    if (!jwtSecret) {
      res.status(500).json({ message: 'JWT_SECRET is not defined' })
      return
    }

    const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, {
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
    })

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
