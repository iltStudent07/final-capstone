import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User, { USER_ROLES } from '../models/User.js';
import { validate } from '../middleware/validate.js';
const router = Router();
const jwtExpiresIn = (process.env.JWT_EXPIRES_IN ?? '1d');
const isObject = (value) => {
    return typeof value === 'object' && value !== null;
};
const registerValidator = (body) => {
    const errors = [];
    if (!isObject(body)) {
        return ['Request body is required'];
    }
    if (typeof body.name !== 'string' || body.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
    }
    if (typeof body.email !== 'string' || !body.email.includes('@')) {
        errors.push('A valid email is required');
    }
    if (typeof body.password !== 'string' || body.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    if (body.role !== undefined && (!USER_ROLES.includes(body.role))) {
        errors.push(`Role must be one of: ${USER_ROLES.join(', ')}`);
    }
    return errors;
};
const loginValidator = (body) => {
    const errors = [];
    if (!isObject(body)) {
        return ['Request body is required'];
    }
    if (typeof body.email !== 'string' || !body.email.includes('@')) {
        errors.push('A valid email is required');
    }
    if (typeof body.password !== 'string' || body.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
    }
    return errors;
};
router.post('/register', validate(registerValidator), async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            res.status(409).json({ message: 'User already exists' });
            return;
        }
        const user = await User.create({
            name,
            email,
            password,
            role,
        });
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ message: 'JWT_SECRET is not defined' });
            return;
        }
        const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, {
            expiresIn: jwtExpiresIn,
        });
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/login', validate(loginValidator), async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const passwordMatch = await user.comparePassword(password);
        if (!passwordMatch) {
            res.status(401).json({ message: 'Invalid credentials' });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ message: 'JWT_SECRET is not defined' });
            return;
        }
        const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, {
            expiresIn: jwtExpiresIn,
        });
        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
export default router;
