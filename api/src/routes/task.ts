import { Router } from 'express'
import Task from '../models/Task.js'
import { auth, type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

type AuthUser = {
  id: string
  role?: string
  email?: string
}

const getAuthUser = (req: AuthenticatedRequest): AuthUser | null => {
  const user = req.user

  if (!user || typeof user !== 'object' || !('id' in user)) {
    return null
  }

  return {
    id: String(user.id),
    role: typeof user.role === 'string' ? user.role : undefined,
    email: typeof user.email === 'string' ? user.email : undefined,
  }
}

router.get('/', auth, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req as AuthenticatedRequest)
    const query = Task.find()

    if (authUser?.role === 'member') {
      query.where('assignee').equals(authUser.id)
    }

    if (typeof req.query.status === 'string') {
      query.where('status').equals(req.query.status)
    }

    if (typeof req.query.priority === 'string') {
      query.where('priority').equals(req.query.priority)
    }

    if (typeof req.query.assignee === 'string' && authUser?.role !== 'member') {
      query.where('assignee').equals(req.query.assignee)
    }

    if (typeof req.query.resource === 'string') {
      query.where('resource').equals(req.query.resource)
    }

    const tasks = await query
      .populate('assignee', 'name email role')
      .populate('resource', 'title status owner')
      .sort({ createdAt: -1 })

    res.json(tasks)
  } catch (error) {
    next(error)
  }
})

router.post('/', auth, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req as AuthenticatedRequest)
    const assigneeId = authUser?.id ?? req.body.assignee
    const isMember = authUser?.role === 'member'

    const task = await Task.create({
      ...req.body,
      assignee: isMember ? assigneeId : req.body.assignee ?? assigneeId,
    })

    const populatedTask = await Task.findById(task._id)
      .populate('assignee', 'name email role')
      .populate('resource', 'title status owner')

    res.status(201).json(populatedTask)
  } catch (error) {
    next(error)
  }
})

router.get('/:id', auth, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req as AuthenticatedRequest)
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email role')
      .populate({
        path: 'resource',
        populate: {
          path: 'owner',
          select: 'name email role',
        },
      })

    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    if (authUser?.role === 'member' && String(task.assignee?._id ?? task.assignee) !== authUser.id) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    res.json(task)
  } catch (error) {
    next(error)
  }
})

router.put('/:id', auth, async (req, res, next) => {
  try {
    const authUser = getAuthUser((req as AuthenticatedRequest))
    const task = await Task.findById(req.params.id)

    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    if (authUser?.role === 'member') {
      const taskAssigneeId = String(task.assignee)

      if (taskAssigneeId !== authUser.id) {
        res.status(403).json({ message: 'You can only update tasks assigned to you' })
        return
      }

      const allowedKeys = Object.keys(req.body)
      const invalidKeys = allowedKeys.filter((key) => key !== 'status')

      if (invalidKeys.length) {
        res.status(400).json({ message: 'Members can only update task status' })
        return
      }

      task.status = req.body.status ?? task.status
      await task.save()

      const populatedTask = await Task.findById(task._id)
        .populate('assignee', 'name email role')
        .populate('resource', 'title status owner')

      res.json(populatedTask)
      return
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!updatedTask) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    res.json(updatedTask)
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', auth, async (req, res, next) => {
  try {
    const authUser = getAuthUser(req as AuthenticatedRequest)
    const task = await Task.findById(req.params.id)

    if (!task) {
      res.status(404).json({ message: 'Task not found' })
      return
    }

    if (authUser?.role === 'member') {
      res.status(403).json({ message: 'Members cannot delete tasks' })
      return
    }

    await Task.findByIdAndDelete(req.params.id)

    res.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router