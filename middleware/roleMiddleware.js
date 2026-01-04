/**
 * Middleware to check if the user has one of the allowed roles.
 * Must be used AFTER authMiddleware.
 * 
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
const checkRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            console.warn(`Access denied for user ${req.user.id} with role ${userRole}. Required: ${allowedRoles.join(', ')}`);
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};

module.exports = checkRole;
