import { Router } from 'express'
import Project, { PROJECT_PRIORITIES, PROJECT_STATUSES } from '../models/Project.js'
import { auth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

const getAuthRole = (req: AuthenticatedRequest) => {
  const user = req.user

  if (!user || typeof user !== 'object') return undefined

  return typeof user.role === 'string' ? user.role : undefined
}

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const projectBodyValidator = (body: unknown): string[] => {
  const errors: string[] = []

  if (!isObject(body)) {
    return ['Request body is required']
  }

  if (typeof body.title !== 'undefined' && (typeof body.title !== 'string' || body.title.trim().length < 2)) {
    errors.push('Project title must be at least 2 characters long')
  }

  if (body.description !== undefined && typeof body.description !== 'string') {
    errors.push('Project description must be a string')
  }

  if (body.status !== undefined && !PROJECT_STATUSES.includes(body.status as (typeof PROJECT_STATUSES)[number])) {
    errors.push(`Project status must be one of: ${PROJECT_STATUSES.join(', ')}`)
  }

  if (body.priority !== undefined && !PROJECT_PRIORITIES.includes(body.priority as (typeof PROJECT_PRIORITIES)[number])) {
    errors.push(`Project priority must be one of: ${PROJECT_PRIORITIES.join(', ')}`)
  }

  if (body.assignee !== undefined && body.assignee !== null && typeof body.assignee !== 'string') {
    errors.push('Project assignee must be a Mongo ObjectId string or null')
  }

  if (body.tasks !== undefined && !Array.isArray(body.tasks)) {
    errors.push('Project tasks must be an array')
  }

  if (body.resources !== undefined && !Array.isArray(body.resources)) {
    errors.push('Project resources must be an array')
  }

  return errors
}

const validateQueryFilters = (status?: string, priority?: string): string[] => {
  const errors: string[] = []

  if (status && !PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) {
    errors.push(`Project status must be one of: ${PROJECT_STATUSES.join(', ')}`)
  }

  if (priority && !PROJECT_PRIORITIES.includes(priority as (typeof PROJECT_PRIORITIES)[number])) {
    errors.push(`Project priority must be one of: ${PROJECT_PRIORITIES.join(', ')}`)
  }

  return errors
}

const projectPopulateOptions = [
  { path: 'assignee', select: 'name email role' },
  {
    path: 'resources',
    select: 'title status budget owner collaborators',
    populate: [
      { path: 'owner', select: 'name email role' },
      { path: 'collaborators', select: 'name email role' },
    ],
  },
  { path: 'tasks', select: 'title status priority' },
]

router.get('/', async (req, res, next) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined
    const priority = typeof req.query.priority === 'string' ? req.query.priority : undefined
    const assignee = typeof req.query.assignee === 'string' ? req.query.assignee : undefined
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : undefined
    const page = Number(req.query.page ?? 1)
    const limit = Number(req.query.limit ?? 10)

    const queryErrors = validateQueryFilters(status, priority)
    if (queryErrors.length) {
      res.status(400).json({ message: 'Validation failed', errors: queryErrors })
      return
    }

    const normalizedPage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    const normalizedLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 50) : 10

    const query: Record<string, unknown> = {}

    if (status) query.status = status
    if (priority) query.priority = priority
    if (assignee) query.assignee = assignee

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ]
    }

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate(projectPopulateOptions)
        .sort({ createdAt: -1 })
        .skip((normalizedPage - 1) * normalizedLimit)
        .limit(normalizedLimit)
        .lean(),
      Project.countDocuments(query),
    ])

    res.json({
      data: projects,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages: Math.ceil(total / normalizedLimit) || 1,
      },
    })
  } catch (error) {
    next(error)
  }
})

router.post('/', auth, validate(projectBodyValidator), async (req, res, next) => {
  try {
    const role = getAuthRole(req as AuthenticatedRequest)

    if (role === 'member') {
      res.status(403).json({ message: 'Members cannot create projects' })
      return
    }

    const { title, description = '', status, priority, assignee, tasks = [], resources = [] } = req.body as {
      title: string
      description?: string
      status?: (typeof PROJECT_STATUSES)[number]
      priority?: (typeof PROJECT_PRIORITIES)[number]
      assignee?: string | null
      tasks?: string[]
      resources?: string[]
    }

    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assignee: assignee ?? null,
      tasks,
      resources,
    })

    const populatedProject = await Project.findById(project._id)
      .populate(projectPopulateOptions)

    res.status(201).json(populatedProject)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate(projectPopulateOptions)

    if (!project) {
      res.status(404).json({ message: 'Project not found' })
      return
    }

    res.json(project)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', auth, validate(projectBodyValidator), async (req, res, next) => {
  try {
    const role = getAuthRole(req as AuthenticatedRequest)

    if (role === 'member') {
      res.status(403).json({ message: 'Members cannot edit projects' })
      return
    }

    const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate(projectPopulateOptions)

    if (!project) {
      res.status(404).json({ message: 'Project not found' })
      return
    }

    res.json(project)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const role = getAuthRole(req as AuthenticatedRequest)

    if (role === 'member') {
      res.status(403).json({ message: 'Members cannot delete projects' })
      return
    }

    const project = await Project.findByIdAndDelete(req.params.id)

    if (!project) {
      res.status(404).json({ message: 'Project not found' })
      return
    }

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
