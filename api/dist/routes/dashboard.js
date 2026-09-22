import { Router } from 'express';
import Resource from '../models/Resource.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
const router = Router();
router.get('/stats', auth, async (_req, res, next) => {
    try {
        const [totalUsers, totalResources, openResources] = await Promise.all([
            User.countDocuments(),
            Resource.countDocuments(),
            Resource.where('status').ne('completed').countDocuments(),
        ]);
        res.json({
            totalUsers,
            totalResources,
            openResources,
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
