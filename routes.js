const express = require('express');
const router = express.Router();
const pool = require('./db');

// --- PRODUCTS ---
router.get('/products', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM products ORDER BY name ASC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- EXPENSES (INSUMOS) ---
router.get('/expenses', async (req, res) => {
    const { date } = req.query; // Format: YYYY-MM-DD
    try {
        let query = 'SELECT * FROM expenses';
        const params = [];
        if (date) {
            query += ' WHERE date = ?';
            params.push(date);
        }
        query += ' ORDER BY id DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/expenses', async (req, res) => {
    const { description, amount, date } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO expenses (description, amount, date) VALUES (?, ?, COALESCE(?, CURRENT_DATE))',
            [description, amount, date]
        );
        res.json({ id: result.insertId, description, amount, date });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- PRODUCTION ---
router.get('/production', async (req, res) => {
    const { date } = req.query;
    try {
        let query = `
            SELECT dp.*, p.name as product_name 
            FROM daily_production dp 
            JOIN products p ON dp.product_id = p.id
        `;
        const params = [];
        if (date) {
            query += ' WHERE dp.date = ?';
            params.push(date);
        }
        query += ' ORDER BY dp.id DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/production', async (req, res) => {
    const { product_id, quantity, unit_cost, date } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO daily_production (product_id, quantity, unit_cost, date) VALUES (?, ?, ?, COALESCE(?, CURRENT_DATE))',
            [product_id, quantity, unit_cost, date]
        );
        res.json({ id: result.insertId, message: 'Production added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- SALES ---
router.get('/sales', async (req, res) => {
    const { date } = req.query;
    try {
        let query = `
            SELECT ds.*, p.name as product_name 
            FROM daily_sales ds 
            JOIN products p ON ds.product_id = p.id
        `;
        const params = [];
        if (date) {
            query += ' WHERE ds.date = ?';
            params.push(date);
        }
        query += ' ORDER BY ds.id DESC';
        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/sales', async (req, res) => {
    const { product_id, quantity, unit_price, date } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO daily_sales (product_id, quantity, unit_price, date) VALUES (?, ?, ?, COALESCE(?, CURRENT_DATE))',
            [product_id, quantity, unit_price, date]
        );
        res.json({ id: result.insertId, message: 'Sale added' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- REPORTS ---

// Helper function to get week boundaries
function getWeekBoundaries(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    return {
        start: monday.toISOString().split('T')[0],
        end: sunday.toISOString().split('T')[0]
    };
}

// 1. RESUMEN SEMANAL
router.get('/reports/weekly', async (req, res) => {
    const { date } = req.query; // Reference date for the week
    if (!date) return res.status(400).json({ error: 'Date is required' });

    try {
        const { start, end } = getWeekBoundaries(date);

        // Total Sales
        const [salesRows] = await pool.query(
            'SELECT SUM(quantity * unit_price) as total_sales FROM daily_sales WHERE date BETWEEN ? AND ?',
            [start, end]
        );
        const totalSales = Number(salesRows[0].total_sales || 0);

        // Total Expenses
        const [expenseRows] = await pool.query(
            'SELECT SUM(amount) as total_expenses FROM expenses WHERE date BETWEEN ? AND ?',
            [start, end]
        );
        const totalExpenses = Number(expenseRows[0].total_expenses || 0);

        const weeklyProfit = totalSales - totalExpenses;
        const dailyAverageSales = totalSales / 7;
        const dailyAverageProfit = weeklyProfit / 7;

        res.json({
            period: { start, end },
            totalSales,
            totalExpenses,
            weeklyProfit,
            dailyAverageSales,
            dailyAverageProfit
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. RESUMEN MENSUAL
router.get('/reports/monthly', async (req, res) => {
    const { month } = req.query; // Format: YYYY-MM
    if (!month) return res.status(400).json({ error: 'Month is required (format: YYYY-MM)' });

    try {
        // Get first and last day of the month
        const [year, monthNum] = month.split('-');
        const firstDay = `${year}-${monthNum}-01`;
        const lastDay = new Date(year, monthNum, 0).getDate();
        const endDay = `${year}-${monthNum}-${lastDay}`;

        // Total Sales
        const [salesRows] = await pool.query(
            'SELECT SUM(quantity * unit_price) as total_sales FROM daily_sales WHERE date BETWEEN ? AND ?',
            [firstDay, endDay]
        );
        const totalSales = Number(salesRows[0].total_sales || 0);

        // Total Expenses
        const [expenseRows] = await pool.query(
            'SELECT SUM(amount) as total_expenses FROM expenses WHERE date BETWEEN ? AND ?',
            [firstDay, endDay]
        );
        const totalExpenses = Number(expenseRows[0].total_expenses || 0);

        const monthlyProfit = totalSales - totalExpenses;
        const dailyAverage = monthlyProfit / lastDay;

        res.json({
            month,
            period: { start: firstDay, end: endDay },
            totalSales,
            totalExpenses,
            monthlyProfit,
            dailyAverage,
            daysInMonth: lastDay
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. RENTABILIDAD POR PRODUCTO
router.get('/reports/product-profitability', async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });

    try {
        const [rows] = await pool.query(`
            SELECT 
                p.id,
                p.name,
                COALESCE(SUM(ds.quantity), 0) as quantity_sold,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) as total_sales,
                COALESCE(SUM(dp.quantity * dp.unit_cost), 0) as production_cost,
                COALESCE(SUM(ds.quantity * ds.unit_price) - SUM(dp.quantity * dp.unit_cost), 0) as profit
            FROM products p
            LEFT JOIN daily_sales ds ON p.id = ds.product_id AND ds.date BETWEEN ? AND ?
            LEFT JOIN daily_production dp ON p.id = dp.product_id AND dp.date BETWEEN ? AND ?
            GROUP BY p.id, p.name
            ORDER BY profit DESC
        `, [startDate, endDate, startDate, endDate]);

        const products = rows.map(row => ({
            id: row.id,
            name: row.name,
            quantitySold: Number(row.quantity_sold),
            totalSales: Number(row.total_sales),
            productionCost: Number(row.production_cost),
            profit: Number(row.profit)
        }));

        res.json({
            period: { start: startDate, end: endDate },
            products
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. TENDENCIA DIARIA
router.get('/reports/daily-trend', async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });

    try {
        // Get all dates in range with sales and expenses
        const [rows] = await pool.query(`
            SELECT 
                dates.date,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) as sales,
                COALESCE(expenses.total, 0) as expenses,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) - COALESCE(expenses.total, 0) as profit
            FROM (
                SELECT DISTINCT date FROM daily_sales WHERE date BETWEEN ? AND ?
                UNION
                SELECT DISTINCT date FROM expenses WHERE date BETWEEN ? AND ?
            ) as dates
            LEFT JOIN daily_sales ds ON dates.date = ds.date
            LEFT JOIN (
                SELECT date, SUM(amount) as total 
                FROM expenses 
                WHERE date BETWEEN ? AND ?
                GROUP BY date
            ) as expenses ON dates.date = expenses.date
            GROUP BY dates.date
            ORDER BY dates.date ASC
        `, [startDate, endDate, startDate, endDate, startDate, endDate]);

        const dailyData = rows.map(row => ({
            date: row.date,
            sales: Number(row.sales),
            expenses: Number(row.expenses),
            profit: Number(row.profit)
        }));

        res.json({
            period: { start: startDate, end: endDate },
            dailyData
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. PRODUCTO MÁS RENTABLE DEL PERÍODO
router.get('/reports/most-profitable', async (req, res) => {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ error: 'Start and end dates are required' });

    try {
        const [rows] = await pool.query(`
            SELECT 
                p.id,
                p.name,
                COALESCE(SUM(ds.quantity), 0) as quantity_sold,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) as total_sales,
                COALESCE(SUM(dp.quantity * dp.unit_cost), 0) as production_cost,
                COALESCE(SUM(ds.quantity * ds.unit_price) - SUM(dp.quantity * dp.unit_cost), 0) as profit
            FROM products p
            LEFT JOIN daily_sales ds ON p.id = ds.product_id AND ds.date BETWEEN ? AND ?
            LEFT JOIN daily_production dp ON p.id = dp.product_id AND dp.date BETWEEN ? AND ?
            GROUP BY p.id, p.name
            HAVING profit > 0
            ORDER BY profit DESC
            LIMIT 1
        `, [startDate, endDate, startDate, endDate]);

        if (rows.length === 0) {
            return res.json({
                period: { start: startDate, end: endDate },
                product: null,
                message: 'No hay productos rentables en este período'
            });
        }

        const product = {
            id: rows[0].id,
            name: rows[0].name,
            quantitySold: Number(rows[0].quantity_sold),
            totalSales: Number(rows[0].total_sales),
            productionCost: Number(rows[0].production_cost),
            profit: Number(rows[0].profit)
        };

        res.json({
            period: { start: startDate, end: endDate },
            product
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Legacy daily report (keep for backwards compatibility)
router.get('/reports/daily', async (req, res) => {
    const { date } = req.query; // Required
    if (!date) return res.status(400).json({ error: 'Date is required' });

    try {
        // Total Expenses
        const [expenseRows] = await pool.query(
            'SELECT SUM(amount) as total_expenses FROM expenses WHERE date = ?',
            [date]
        );
        const totalExpenses = Number(expenseRows[0].total_expenses || 0);

        // Total Sales
        const [salesRows] = await pool.query(
            'SELECT SUM(quantity * unit_price) as total_sales FROM daily_sales WHERE date = ?',
            [date]
        );
        const totalSales = Number(salesRows[0].total_sales || 0);

        // Sales by Product (to find most profitable)
        const [productStats] = await pool.query(`
            SELECT 
                p.name, 
                SUM(ds.quantity * ds.unit_price) as sales_amount,
                SUM(ds.quantity) as quantity_sold
            FROM daily_sales ds
            JOIN products p ON ds.product_id = p.id
            WHERE ds.date = ?
            GROUP BY p.id
            ORDER BY sales_amount DESC
        `, [date]);

        const dailyProfit = totalSales - totalExpenses;

        res.json({
            date,
            totalExpenses,
            totalSales,
            dailyProfit,
            topProducts: productStats
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
