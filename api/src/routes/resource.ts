import { Router } from 'express'
import Project from '../models/Project.js'
import Resource from '../models/Resource.js'
import Task from '../models/Task.js'
import { auth, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

const getAuthRole = (req: AuthenticatedRequest) => {
  const user = req.user

  if (!user || typeof user !== 'object') return undefined

  return typeof user.role === 'string' ? user.role : undefined
}

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
    const role = getAuthRole(req as AuthenticatedRequest)

    if (role === 'member') {
      res.status(403).json({ message: 'Members cannot create resources' })
      return
    }

    const authenticatedUser = (req as AuthenticatedRequest).user
    const ownerId =
      typeof authenticatedUser === 'object' && authenticatedUser !== null && 'id' in authenticatedUser
        ? String(authenticatedUser.id)
        : req.body.owner

    const projectId = typeof req.body.project === 'string' ? req.body.project : ''
    const project = await Project.findById(projectId)

    if (!project) {
      res.status(404).json({ message: 'Project not found' })
      return
    }

    const resource = await Resource.create({
      ...req.body,
      owner: req.body.owner ?? ownerId,
    })

    await Project.findByIdAndUpdate(project._id, {
      $addToSet: { resources: resource._id },
    })

    const populatedResource = await Resource.findById(resource._id)
      .populate('project', 'title status priority')
      .populate('owner', 'name email role')
      .populate('collaborators', 'name email role')

    res.status(201).json(populatedResource)
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
    const role = getAuthRole(req as AuthenticatedRequest)

    if (role === 'member') {
      res.status(403).json({ message: 'Members cannot edit resources' })
      return
    }

    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
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

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const role = getAuthRole(req as AuthenticatedRequest)

    if (role === 'member') {
      res.status(403).json({ message: 'Members cannot delete resources' })
      return
    }

    const resource = await Resource.findById(req.params.id)

    if (!resource) {
      res.status(404).json({ message: 'Resource not found' })
      return
    }

    const tasks = await Task.find({ resource: resource._id }).select('_id').lean()
    const taskIds = tasks.map((task) => task._id)

    await Task.deleteMany({ resource: resource._id })
    await Resource.findByIdAndDelete(resource._id)

    await Project.findByIdAndUpdate(resource.project, {
      $pull: {
        resources: resource._id,
        ...(taskIds.length > 0 ? { tasks: { $in: taskIds } } : {}),
      },
    })

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
