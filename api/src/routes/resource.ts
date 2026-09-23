import { Router } from 'express'
import Resource from '../models/Resource.js'
import { auth, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req, res, next) => {
  try {
    const query = Resource.find()

    if (typeof req.query.status === 'string') {
      query.where('status').equals(req.query.status)
    }

    if (typeof req.query.owner === 'string') {
      query.where('owner').equals(req.query.owner)
    }

    if (typeof req.query.project === 'string') {
      query.where('project').equals(req.query.project)
    }

    if (typeof req.query.tag === 'string') {
      query.where('tags').in([req.query.tag])
    }

    const resources = await query
      .populate('project', 'title status priority')
      .populate('owner', 'name email role')
      .populate('collaborators', 'name email role')
      .sort({ createdAt: -1 })

    res.json(resources)
  } catch (error) {
    next(error)
  }
})

router.post('/', auth, async (req, res, next) => {
  try {
    const authenticatedUser = (req as AuthenticatedRequest).user
    const ownerId =
      typeof authenticatedUser === 'object' && authenticatedUser !== null && 'id' in authenticatedUser
        ? String(authenticatedUser.id)
        : req.body.owner

    const resource = await Resource.create({
      ...req.body,
      owner: req.body.owner ?? ownerId,
    })

    res.status(201).json(resource)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('project', 'title status priority')
      .populate('owner', 'name email role')
      .populate('collaborators', 'name email role')

    if (!resource) {
      res.status(404).json({ message: 'Resource not found' })
      return
    }

    res.json(resource)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', auth, async (req, res, next) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!resource) {
      res.status(404).json({ message: 'Resource not found' })
      return
    }

    res.json(resource)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.id)

    if (!resource) {
      res.status(404).json({ message: 'Resource not found' })
      return
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
