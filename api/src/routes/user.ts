import { Router } from 'express'
import User from '../models/User.js'
import { auth } from '../middleware/auth.js'

const router = Router()

router.get('/', auth, async (_req, res, next) => {
  try {
    const users = await User.find({}, '_id name email role')
      .sort({ name: 1 })
      .lean()

    res.json(users)
  } catch (error) {
    next(error)
  }
})

export default router
