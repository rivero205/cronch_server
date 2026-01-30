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
        console.log('[GET /api/expenses] arrival', new Date().toISOString(), { query: req.query, user: req.user?.id });
        const filters = {};
        if (req.query.date) filters.date = req.query.date;
        if (typeof req.query.limit !== 'undefined') filters.limit = Number(req.query.limit);
        if (typeof req.query.offset !== 'undefined') filters.offset = Number(req.query.offset);
        if (req.query.cursorDate) filters.cursorDate = req.query.cursorDate;
        if (typeof req.query.cursorId !== 'undefined') filters.cursorId = Number(req.query.cursorId);

        const expenses = await expenseService.getExpenses(req.user.id, req.user.business_id, filters);
        // keyset response
        if (expenses && typeof expenses === 'object' && Array.isArray(expenses.rows)) {
            if (expenses.total !== undefined) {
                res.set('X-Total-Count', String(expenses.total || 0));
                return res.json({ data: expenses.rows, total: expenses.total });
            }
            // keyset mode
            if (expenses.nextCursor) {
                res.set('X-Next-Cursor', `${expenses.nextCursor.date.toISOString ? expenses.nextCursor.date.toISOString() : expenses.nextCursor.date}|${expenses.nextCursor.id}`);
            }
            return res.json({ data: expenses.rows, nextCursor: expenses.nextCursor });
        }

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
