const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// Create Profile (Called after Supabase Auth SignUp typically, or manually)
// We use authMiddleware to ensure the user is logged in (has a token)
router.post('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // From authMiddleware
        const { businessId, firstName, lastName, phone, position } = req.body;

        const profile = await userService.createProfile(userId, businessId, {
            firstName,
            lastName,
            phone,
            position
        });

        res.status(201).json(profile);
    } catch (error) {
        console.error('Create profile error', error);
        res.status(400).json({ error: error.message });
    }
});

// Get My Profile
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await userService.getMyProfile(userId);

        if (!profile) {
            return res.status(404).json({
                error: 'Profile not found',
                message: 'No profile exists for this user. Please contact an administrator.',
                userId: userId
            });
        }

        res.json(profile);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get Users of my Business (Admin only) OR All Users (Super Admin)
router.get('/', authMiddleware, checkRole(['super_admin', 'admin']), async (req, res) => {
    try {
        let users;

        if (req.user.role === 'super_admin') {
            // Super admin gets all users across all businesses
            users = await userService.getAllUsers();
        } else {
            // Admin gets only users from their business
            users = await userService.getBusinessUsers(req.user.id);
        }

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update user role (Admin and Super Admin)
router.patch('/:userId/role', authMiddleware, checkRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }

        // If admin, verify they can only change roles within their business
        if (req.user.role === 'admin') {
            const userService = require('../services/userService');
            const targetUser = await userService.getUserById(userId);
            
            if (!targetUser || targetUser.business_id !== req.user.business_id) {
                return res.status(403).json({ error: 'Forbidden: Cannot modify users from other businesses' });
            }
            
            // Admins cannot create super_admins
            if (role === 'super_admin') {
                return res.status(403).json({ error: 'Forbidden: Cannot assign super_admin role' });
            }
        }

        const user = await userService.updateUserRole(userId, role);
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update user status (Admin and Super Admin)
router.patch('/:userId/status', authMiddleware, checkRole(['super_admin', 'admin']), async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        if (isActive === undefined) {
            return res.status(400).json({ error: 'isActive is required' });
        }

        // If admin, verify they can only change status within their business
        if (req.user.role === 'admin') {
            const targetUser = await userService.getUserById(userId);
            
            if (!targetUser || targetUser.business_id !== req.user.business_id) {
                return res.status(403).json({ error: 'Forbidden: Cannot modify users from other businesses' });
            }
        }

        const user = await userService.updateUserStatus(userId, isActive);
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Assign user to business (Super Admin only)
router.patch('/:userId/business', authMiddleware, checkRole(['super_admin']), async (req, res) => {
    try {
        const { userId } = req.params;
        const { businessId } = req.body;

        if (!businessId) {
            return res.status(400).json({ error: 'businessId is required' });
        }

        const user = await userService.assignUserToBusiness(userId, businessId);
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
