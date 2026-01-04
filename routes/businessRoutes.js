const express = require('express');
const router = express.Router();
const businessService = require('../services/businessService');
const authMiddleware = require('../middleware/authMiddleware');
const checkRole = require('../middleware/roleMiddleware');

// Get all active businesses (Public, for registration dropdown)
router.get('/active', async (req, res) => {
    try {
        const businesses = await businessService.getActiveBusinesses();
        res.json(businesses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all businesses with full details (Super Admin only)
router.get('/', authMiddleware, checkRole(['super_admin']), async (req, res) => {
    try {
        const businesses = await businessService.getAllBusinesses();
        res.json(businesses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single business by ID (Admin can get their own, Super Admin can get any)
router.get('/:id', authMiddleware, checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const business = await businessService.getBusinessById(id);
        
        // Verify admin can only see their own business
        if (req.user.role === 'admin' && req.user.business_id !== id) {
            return res.status(403).json({ error: 'Forbidden: Cannot access other businesses' });
        }
        
        res.json(business);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new business (Super Admin only)
router.post('/', authMiddleware, checkRole(['super_admin']), async (req, res) => {
    try {
        const business = await businessService.createBusiness(req.body);
        res.status(201).json(business);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update business (Admin can update their own, Super Admin can update any)
router.put('/:id', authMiddleware, checkRole(['admin', 'super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verify admin can only update their own business
        if (req.user.role === 'admin' && req.user.business_id !== id) {
            return res.status(403).json({ error: 'Forbidden: Cannot update other businesses' });
        }
        
        const business = await businessService.updateBusiness(id, req.body);
        res.json(business);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Deactivate business (Super Admin only)
router.delete('/:id', authMiddleware, checkRole(['super_admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const business = await businessService.deactivateBusiness(id);
        res.json(business);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;
