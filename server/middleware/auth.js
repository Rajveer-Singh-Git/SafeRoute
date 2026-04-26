const { verifyToken } = require('../utils/jwt');

const protect = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        const decoded = verifyToken(token);

        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        }

        req.userId = decoded.userId;
        next();

    } catch (error) {

        console.log('Auth middleware error : ', error);
        res.status(500).json({
            success: false,
            message: 'Authentication error'
        });

    }
};

module.exports = { protect };