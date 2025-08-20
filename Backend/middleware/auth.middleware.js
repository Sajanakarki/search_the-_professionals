import jwt from 'jsonwebtoken';

export function authMiddleware(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1]; // Fix: split by space

    if (!token) {
        return res.status(403).json({ message: 'Token not found' });
    }

    try {
        const data = jwt.verify(token, process.env.JWT_SECRET);
        req.user = data;
        next();
    } catch (e) {
        res.status(401).json({ message: 'Invalid token' });
    }
}