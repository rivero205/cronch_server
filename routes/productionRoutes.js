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
        console.log('[GET /api/production] arrival', new Date().toISOString(), { query: req.query, user: req.user?.id });
        const filters = {};
        if (req.query.date) filters.date = req.query.date;
        if (typeof req.query.limit !== 'undefined') filters.limit = Number(req.query.limit);
        if (typeof req.query.offset !== 'undefined') filters.offset = Number(req.query.offset);
        if (req.query.cursorDate) filters.cursorDate = req.query.cursorDate;
        if (typeof req.query.cursorId !== 'undefined') filters.cursorId = Number(req.query.cursorId);

        const production = await productionService.getProduction(req.user.id, req.user.business_id, filters);
        if (production && typeof production === 'object' && Array.isArray(production.rows)) {
            if (production.total !== undefined) {
                res.set('X-Total-Count', String(production.total || 0));
                return res.json({ data: production.rows, total: production.total });
            }
            if (production.nextCursor) {
                res.set('X-Next-Cursor', `${production.nextCursor.date.toISOString ? production.nextCursor.date.toISOString() : production.nextCursor.date}|${production.nextCursor.id}`);
            }
            return res.json({ data: production.rows, nextCursor: production.nextCursor });
        }

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
