const express = require('express');
const router = express.Router();
const salesService = require('../services/salesService');
const { validateSale } = require('../middleware/validators');

const checkRole = require('../middleware/roleMiddleware');

// Apply Role Check (Super Admin, Admin, Editor)
router.use(checkRole(['super_admin', 'admin', 'editor']));

// GET /api/sales
router.get('/', async (req, res) => {
    try {
        const filters = {};
        if (req.query.date) {
            filters.date = req.query.date;
        }

        const sales = await salesService.getSales(req.user.id, req.user.business_id, filters);
        res.json(sales);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/sales
router.post('/', validateSale, async (req, res) => {
    try {
        const sale = await salesService.createSale(req.user.id, req.user.business_id, req.body);
        res.json({ ...sale, message: 'Sale added' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/sales/:id
router.put('/:id', validateSale, async (req, res) => {
    try {
        const sale = await salesService.updateSale(req.user.id, req.user.business_id, req.params.id, req.body);
        res.json(sale);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/sales/:id
router.delete('/:id', async (req, res) => {
    try {
        const result = await salesService.deleteSale(req.user.id, req.user.business_id, req.params.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
