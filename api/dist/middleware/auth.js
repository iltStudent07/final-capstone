import jwt from 'jsonwebtoken';
export const auth = (req, res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    const token = header.slice(7);
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        res.status(500).json({ message: 'JWT_SECRET is not defined' });
        return;
    }
    try {
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({ message: 'Invalid token' });
    }
};
