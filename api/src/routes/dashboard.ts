import { Router } from 'express'
import type { RequestHandler } from 'express'
import Resource from '../models/Resource.js'
import Task from '../models/Task.js'
import User from '../models/User.js'
import { auth } from '../middleware/auth.js'

const router = Router()

const getDashboardStats: RequestHandler = async (_req, res, next) => {
  try {
    const [
      totalUsers,
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
      Resource.countDocuments(),
      Task.countDocuments(),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Resource.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.find({}, 'name email role createdAt').sort({ createdAt: -1 }).limit(5).lean(),
      Resource.find({}, 'title status budget owner createdAt')
        .populate('owner', 'name email role')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Task.find({}, 'title status priority assignee resource dueDate createdAt')
        .populate('assignee', 'name email role')
        .populate('resource', 'title status')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Resource.where('status').ne('completed').countDocuments(),
      Task.aggregate([
        {
          $match: {
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

    res.json({
      totals: {
        users: totalUsers,
        resources: totalResources,
        tasks: totalTasks,
      },
      grouped: {
        usersByRole,
        resourcesByStatus,
        tasksByStatus,
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
