import { Router } from 'express';
import Resource from '../models/Resource.js';
import { auth } from '../middleware/auth.js';
const router = Router();
router.use(auth);
router.get('/', async (_req, res, next) => {
    try {
        const resources = await Resource.find().sort({ createdAt: -1 });
        res.json(resources);
    }
    catch (error) {
        next(error);
    }
});
router.post('/', async (req, res, next) => {
    try {
        const resource = await Resource.create(req.body);
        res.status(201).json(resource);
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            res.status(404).json({ message: 'Resource not found' });
            return;
        }
        res.json(resource);
    }
    catch (error) {
        next(error);
    }
});
router.put('/:id', async (req, res, next) => {
    try {
        const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!resource) {
            res.status(404).json({ message: 'Resource not found' });
            return;
        }
        res.json(resource);
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        const resource = await Resource.findByIdAndDelete(req.params.id);
        if (!resource) {
            res.status(404).json({ message: 'Resource not found' });
            return;
        }
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
export default router;
