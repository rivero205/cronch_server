const express = require('express');
const router = express.Router();
const productionService = require('../services/productionService');
const { validateProduction } = require('../middleware/validators');

const checkRole = require('../middleware/roleMiddleware');

// Apply Role Check (Super Admin, Admin, Editor)
router.use(checkRole(['super_admin', 'admin', 'editor']));

// GET /api/production
router.get('/', async (req, res) => {
    try {
        const filters = {};
        if (req.query.date) {
            filters.date = req.query.date;
        }

        const production = await productionService.getProduction(req.user.id, req.user.business_id, filters);
        res.json(production);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/production
router.post('/', validateProduction, async (req, res) => {
    try {
        const production = await productionService.createProduction(req.user.id, req.user.business_id, req.body);
        res.json({ ...production, message: 'Production added' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/production/:id
router.put('/:id', validateProduction, async (req, res) => {
    try {
        const production = await productionService.updateProduction(req.user.id, req.user.business_id, req.params.id, req.body);
        res.json(production);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/production/:id
router.delete('/:id', async (req, res) => {
    try {
        const result = await productionService.deleteProduction(req.user.id, req.user.business_id, req.params.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
