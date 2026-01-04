const express = require('express');
const router = express.Router();
const expenseService = require('../services/expenseService');
const { validateExpense } = require('../middleware/validators');

const checkRole = require('../middleware/roleMiddleware');

// Apply Role Check (Super Admin, Admin, Editor)
router.use(checkRole(['super_admin', 'admin', 'editor']));

// GET /api/expenses
router.get('/', async (req, res) => {
    try {
        const filters = {};
        if (req.query.date) {
            filters.date = req.query.date;
        }

        const expenses = await expenseService.getExpenses(req.user.id, req.user.business_id, filters);
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/expenses
router.post('/', validateExpense, async (req, res) => {
    try {
        const expense = await expenseService.createExpense(req.user.id, req.user.business_id, req.body);
        res.json(expense);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/expenses/:id
router.put('/:id', validateExpense, async (req, res) => {
    try {
        const expense = await expenseService.updateExpense(req.user.id, req.user.business_id, req.params.id, req.body);
        res.json(expense);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
    try {
        const result = await expenseService.deleteExpense(req.user.id, req.user.business_id, req.params.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
