import { Router } from 'express'
import type { RequestHandler } from 'express'
import { Types } from 'mongoose'
import Project from '../models/Project.js'
import Resource from '../models/Resource.js'
import Task, { TASK_STATUSES } from '../models/Task.js'
import User from '../models/User.js'
import { auth } from '../middleware/auth.js'
import { type AuthenticatedRequest } from '../middleware/auth.js'

const router = Router()

type AuthUser = {
  id: string
  role?: string
}

const formatStatusLabel = (status: string) => {
  return status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const normalizeTaskStatusCounts = (
  counts: Array<{ _id: string; count: number }>,
) => {
  return TASK_STATUSES.map((status) => {
    const match = counts.find((item) => item._id === status)

    return {
      status: formatStatusLabel(status),
      statusKey: status.replace(/[^a-z0-9]/gi, ''),
      count: match?.count ?? 0,
    }
  })
}

const getDashboardStats: RequestHandler = async (_req, res, next) => {
  try {
    const req = _req as AuthenticatedRequest
    const user = req.user && typeof req.user === 'object' && 'id' in req.user
      ? { id: String(req.user.id), role: typeof req.user.role === 'string' ? req.user.role : undefined } as AuthUser
      : null

    const taskMatch = user?.role === 'member' && Types.ObjectId.isValid(user.id)
      ? { assignee: new Types.ObjectId(user.id) }
      : {}

    const [
      totalUsers,
      totalProjects,
      totalResources,
      totalTasks,
      usersByRole,
      resourcesByStatus,
      tasksByStatus,
      tasksByPriority,
      recentUsers,
      recentResources,
      recentTasks,
      openResources,
      overdueTasks,
      averageResourceBudget,
    ] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Resource.countDocuments(),
      Task.countDocuments(taskMatch),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Resource.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $match: taskMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $match: taskMatch },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.find({}, 'name email role createdAt').sort({ createdAt: -1 }).limit(5).lean(),
      Resource.find({}, 'title status budget owner createdAt')
        .populate('owner', 'name email role')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Task.find(taskMatch, 'title status priority assignee resource dueDate createdAt')
        .populate('assignee', 'name email role')
        .populate('resource', 'title status')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Resource.where('status').ne('completed').countDocuments(),
      Task.aggregate([
        {
          $match: {
            ...taskMatch,
            dueDate: { $lt: new Date() },
            status: { $ne: 'done' },
          },
        },
        { $count: 'count' },
      ]),
      Resource.aggregate([
        {
          $group: {
            _id: null,
            averageBudget: { $avg: '$budget' },
          },
        },
      ]),
    ])

    const normalizedTasksByStatus = normalizeTaskStatusCounts(tasksByStatus as Array<{ _id: string; count: number }>)

    res.json({
      totals: {
        users: totalUsers,
        projects: totalProjects,
        resources: totalResources,
        tasks: totalTasks,
      },
      grouped: {
        usersByRole,
        resourcesByStatus,
        tasksByStatus: normalizedTasksByStatus,
        tasksByPriority,
      },
      recent: {
        users: recentUsers,
        resources: recentResources,
        tasks: recentTasks,
      },
      metrics: {
        openResources,
        overdueTasks: overdueTasks[0]?.count ?? 0,
        averageResourceBudget: averageResourceBudget[0]?.averageBudget ?? 0,
      },
    })
  } catch (error) {
    next(error)
  }
}

router.get('/', auth, getDashboardStats)
router.get('/stats', auth, getDashboardStats)

export default router
