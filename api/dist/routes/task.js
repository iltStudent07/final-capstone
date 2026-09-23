import { Router } from 'express';
import Task from '../models/Task.js';
import { auth } from '../middleware/auth.js';
const router = Router();
router.get('/', async (req, res, next) => {
    try {
        const query = Task.find();
        if (typeof req.query.status === 'string') {
            query.where('status').equals(req.query.status);
        }
        if (typeof req.query.priority === 'string') {
            query.where('priority').equals(req.query.priority);
        }
        if (typeof req.query.assignee === 'string') {
            query.where('assignee').equals(req.query.assignee);
        }
        if (typeof req.query.resource === 'string') {
            query.where('resource').equals(req.query.resource);
        }
        const tasks = await query
            .populate('assignee', 'name email role')
            .populate('resource', 'title status owner')
            .sort({ createdAt: -1 });
        res.json(tasks);
    }
    catch (error) {
        next(error);
    }
});
router.post('/', auth, async (req, res, next) => {
    try {
        const task = await Task.create(req.body);
        res.status(201).json(task);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignee', 'name email role')
            .populate({
            path: 'resource',
            populate: {
                path: 'owner',
                select: 'name email role',
            },
        });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        res.json(task);
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', auth, async (req, res, next) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        res.json(task);
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', auth, async (req, res, next) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
export default router;
