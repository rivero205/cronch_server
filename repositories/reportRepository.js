const sql = require('../db');

class ReportRepository {
    async getProductProfitability(userId, businessId, startDate, endDate) {
        const result = await sql`
            SELECT 
                p.id,
                p.name,
                COALESCE(SUM(ds.quantity), 0) as quantity_sold,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) as total_sales,
                COALESCE(SUM(dp.quantity * dp.unit_cost), 0) as production_cost,
                COALESCE(SUM(ds.quantity * ds.unit_price) - SUM(dp.quantity * dp.unit_cost), 0) as profit
            FROM products p
            LEFT JOIN daily_sales ds ON p.id = ds.product_id AND ds.date BETWEEN ${startDate} AND ${endDate} AND ds.business_id = ${businessId}
            LEFT JOIN daily_production dp ON p.id = dp.product_id AND dp.date BETWEEN ${startDate} AND ${endDate} AND dp.business_id = ${businessId}
            WHERE p.business_id = ${businessId}
            GROUP BY p.id, p.name
            ORDER BY profit DESC
        `;

        return result.map(row => ({
            id: row.id,
            name: row.name,
            quantitySold: Number(row.quantity_sold),
            totalSales: Number(row.total_sales),
            productionCost: Number(row.production_cost),
            profit: Number(row.profit)
        }));
    }

    async getDailyTrend(userId, businessId, startDate, endDate) {
        const result = await sql`
            SELECT 
                dates.date,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) as sales,
                COALESCE(MAX(expenses.total), 0) as expenses,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) - COALESCE(MAX(expenses.total), 0) as profit
            FROM (
                SELECT DISTINCT date FROM daily_sales WHERE business_id = ${businessId} AND date BETWEEN ${startDate} AND ${endDate}
                UNION
                SELECT DISTINCT date FROM expenses WHERE business_id = ${businessId} AND date BETWEEN ${startDate} AND ${endDate}
            ) as dates
            LEFT JOIN daily_sales ds ON dates.date = ds.date AND ds.business_id = ${businessId}
            LEFT JOIN (
                SELECT date, SUM(amount) as total 
                FROM expenses 
                WHERE business_id = ${businessId} AND date BETWEEN ${startDate} AND ${endDate}
                GROUP BY date
            ) as expenses ON dates.date = expenses.date
            GROUP BY dates.date
            ORDER BY dates.date ASC
        `;

        return result.map(row => ({
            date: row.date,
            sales: Number(row.sales),
            expenses: Number(row.expenses),
            profit: Number(row.profit)
        }));
    }

    async getMostProfitableProduct(userId, businessId, startDate, endDate) {
        const result = await sql`
            SELECT 
                p.id,
                p.name,
                COALESCE(SUM(ds.quantity), 0) as quantity_sold,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) as total_sales,
                COALESCE(SUM(dp.quantity * dp.unit_cost), 0) as production_cost,
                COALESCE(SUM(ds.quantity * ds.unit_price) - SUM(dp.quantity * dp.unit_cost), 0) as profit
            FROM products p
            LEFT JOIN daily_sales ds ON p.id = ds.product_id AND ds.date BETWEEN ${startDate} AND ${endDate} AND ds.business_id = ${businessId}
            LEFT JOIN daily_production dp ON p.id = dp.product_id AND dp.date BETWEEN ${startDate} AND ${endDate} AND dp.business_id = ${businessId}
            WHERE p.business_id = ${businessId}
            GROUP BY p.id, p.name
            HAVING COALESCE(SUM(ds.quantity * ds.unit_price) - SUM(dp.quantity * dp.unit_cost), 0) > 0
            ORDER BY profit DESC
            LIMIT 1
        `;

        if (result.length === 0) {
            return null;
        }

        return {
            id: result[0].id,
            name: result[0].name,
            quantitySold: Number(result[0].quantity_sold),
            totalSales: Number(result[0].total_sales),
            productionCost: Number(result[0].production_cost),
            profit: Number(result[0].profit)
        };
    }

    // ========== DETAILED REPORTS FOR DOWNLOAD ==========

    async getDetailedWeeklyReport(userId, businessId, startDate, endDate) {
        // Datos diarios de ventas
        const salesResult = await sql`
            SELECT 
                ds.date,
                p.name as product_name,
                ds.quantity,
                ds.unit_price,
                (ds.quantity * ds.unit_price) as total
            FROM daily_sales ds
            JOIN products p ON ds.product_id = p.id
            WHERE ds.business_id = ${businessId} AND ds.date BETWEEN ${startDate} AND ${endDate}
            ORDER BY ds.date ASC, p.name ASC
        `;

        // Datos diarios de gastos
        const expensesResult = await sql`
            SELECT date, description, amount
            FROM expenses
            WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
            ORDER BY date ASC
        `;

        // Resumen por día (PostgreSQL date series generation)
        const summaryResult = await sql`
            SELECT 
                dates.date,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) as sales,
                COALESCE(MAX(expenses.total), 0) as expenses,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) - COALESCE(MAX(expenses.total), 0) as profit
            FROM (
                SELECT generate_series(${startDate}::date, ${endDate}::date, '1 day'::interval)::date as date
            ) as dates
            LEFT JOIN daily_sales ds ON dates.date = ds.date AND ds.business_id = ${businessId}
            LEFT JOIN (
                SELECT date, SUM(amount) as total 
                FROM expenses 
                WHERE business_id = ${businessId} AND date BETWEEN ${startDate} AND ${endDate}
                GROUP BY date
            ) as expenses ON dates.date = expenses.date
            GROUP BY dates.date
            ORDER BY dates.date ASC
        `;

        return {
            dailySales: salesResult.map(row => ({
                date: row.date,
                productName: row.product_name,
                quantity: Number(row.quantity),
                unitPrice: Number(row.unit_price),
                total: Number(row.total)
            })),
            dailyExpenses: expensesResult.map(row => ({
                date: row.date,
                description: row.description,
                amount: Number(row.amount)
            })),
            dailySummary: summaryResult.map(row => ({
                date: row.date,
                sales: Number(row.sales),
                expenses: Number(row.expenses),
                profit: Number(row.profit)
            }))
        };
    }

    async getDetailedMonthlyReport(userId, businessId, startDate, endDate) {
        // Datos diarios de ventas
        const salesResult = await sql`
            SELECT 
                ds.date,
                p.name as product_name,
                ds.quantity,
                ds.unit_price,
                (ds.quantity * ds.unit_price) as total
            FROM daily_sales ds
            JOIN products p ON ds.product_id = p.id
            WHERE ds.business_id = ${businessId} AND ds.date BETWEEN ${startDate} AND ${endDate}
            ORDER BY ds.date ASC, p.name ASC
        `;

        // Datos diarios de gastos
        const expensesResult = await sql`
            SELECT date, description, amount
            FROM expenses
            WHERE user_id = ${userId} AND date BETWEEN ${startDate} AND ${endDate}
            ORDER BY date ASC
        `;

        // Datos diarios de producción
        const productionResult = await sql`
            SELECT 
                dp.date,
                p.name as product_name,
                dp.quantity,
                dp.unit_cost,
                (dp.quantity * dp.unit_cost) as total_cost
            FROM daily_production dp
            JOIN products p ON dp.product_id = p.id
            WHERE dp.business_id = ${businessId} AND dp.date BETWEEN ${startDate} AND ${endDate}
            ORDER BY dp.date ASC, p.name ASC
        `;

        // Resumen por día
        const summaryResult = await sql`
            SELECT 
                dates.date,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) as sales,
                COALESCE(MAX(expenses.total), 0) as expenses,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) - COALESCE(MAX(expenses.total), 0) as profit
            FROM (
                SELECT DISTINCT date FROM daily_sales WHERE business_id = ${businessId} AND date BETWEEN ${startDate} AND ${endDate}
                UNION
                SELECT DISTINCT date FROM expenses WHERE business_id = ${businessId} AND date BETWEEN ${startDate} AND ${endDate}
            ) as dates
            LEFT JOIN daily_sales ds ON dates.date = ds.date AND ds.business_id = ${businessId}
            LEFT JOIN (
                SELECT date, SUM(amount) as total 
                FROM expenses 
                WHERE business_id = ${businessId} AND date BETWEEN ${startDate} AND ${endDate}
                GROUP BY date
            ) as expenses ON dates.date = expenses.date
            GROUP BY dates.date
            ORDER BY dates.date ASC
        `;

        // Resumen de productos más vendidos
        const topProductsResult = await sql`
            SELECT 
                p.name,
                SUM(ds.quantity) as total_quantity,
                SUM(ds.quantity * ds.unit_price) as total_revenue
            FROM daily_sales ds
            JOIN products p ON ds.product_id = p.id
            WHERE ds.business_id = ${businessId} AND ds.date BETWEEN ${startDate} AND ${endDate}
            GROUP BY p.id, p.name
            ORDER BY total_revenue DESC
            LIMIT 5
        `;

        return {
            dailySales: salesResult.map(row => ({
                date: row.date,
                productName: row.product_name,
                quantity: Number(row.quantity),
                unitPrice: Number(row.unit_price),
                total: Number(row.total)
            })),
            dailyExpenses: expensesResult.map(row => ({
                date: row.date,
                description: row.description,
                amount: Number(row.amount)
            })),
            dailyProduction: productionResult.map(row => ({
                date: row.date,
                productName: row.product_name,
                quantity: Number(row.quantity),
                unitCost: Number(row.unit_cost),
                totalCost: Number(row.total_cost)
            })),
            dailySummary: summaryResult.map(row => ({
                date: row.date,
                sales: Number(row.sales),
                expenses: Number(row.expenses),
                profit: Number(row.profit)
            })),
            topProducts: topProductsResult.map(row => ({
                name: row.name,
                totalQuantity: Number(row.total_quantity),
                totalRevenue: Number(row.total_revenue)
            }))
        };
    }

    async getDetailedProductProfitability(userId, businessId, startDate, endDate) {
        // Ventas por producto por día
        const salesResult = await sql`
            SELECT 
                ds.date,
                p.name as product_name,
                ds.quantity,
                ds.unit_price,
                (ds.quantity * ds.unit_price) as revenue
            FROM daily_sales ds
            JOIN products p ON ds.product_id = p.id
            WHERE ds.business_id = ${businessId} AND ds.date BETWEEN ${startDate} AND ${endDate}
            ORDER BY p.name ASC, ds.date ASC
        `;

        // Producción por producto por día
        const productionResult = await sql`
            SELECT 
                dp.date,
                p.name as product_name,
                dp.quantity,
                dp.unit_cost,
                (dp.quantity * dp.unit_cost) as cost
            FROM daily_production dp
            JOIN products p ON dp.product_id = p.id
            WHERE dp.business_id = ${businessId} AND dp.date BETWEEN ${startDate} AND ${endDate}
            ORDER BY p.name ASC, dp.date ASC
        `;

        return {
            salesByDay: salesResult.map(row => ({
                date: row.date,
                productName: row.product_name,
                quantity: Number(row.quantity),
                unitPrice: Number(row.unit_price),
                revenue: Number(row.revenue)
            })),
            productionByDay: productionResult.map(row => ({
                date: row.date,
                productName: row.product_name,
                quantity: Number(row.quantity),
                unitCost: Number(row.unit_cost),
                cost: Number(row.cost)
            }))
        };
    }

    // ========== SUPER ADMIN GLOBAL REPORTS ==========

    async getGlobalSummary(startDate, endDate) {
        const result = await sql`
            SELECT 
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) as total_sales,
                COALESCE((
                    SELECT SUM(amount) FROM expenses WHERE date BETWEEN ${startDate} AND ${endDate}
                ), 0) as total_expenses,
                COALESCE(SUM(ds.quantity * ds.unit_price), 0) - COALESCE((
                    SELECT SUM(amount) FROM expenses WHERE date BETWEEN ${startDate} AND ${endDate}
                ), 0) as total_profit,
                COUNT(DISTINCT ds.business_id) as active_businesses
            FROM daily_sales ds
            WHERE ds.date BETWEEN ${startDate} AND ${endDate}
        `;

        const row = result[0];
        return {
            totalSales: Number(row.total_sales),
            totalExpenses: Number(row.total_expenses),
            totalProfit: Number(row.total_profit),
            activeBusinesses: Number(row.active_businesses)
        };
    }

    async getBusinessRanking(startDate, endDate, maxResults = 10) {
        const result = await sql`
            WITH BusinessStats AS (
                SELECT 
                    b.id,
                    b.name,
                    COALESCE(SUM(ds.quantity * ds.unit_price), 0) as sales,
                    COALESCE((
                        SELECT SUM(e.amount) 
                        FROM expenses e 
                        WHERE e.business_id = b.id AND e.date BETWEEN ${startDate} AND ${endDate}
                    ), 0) as expenses
                FROM businesses b
                LEFT JOIN daily_sales ds ON b.id = ds.business_id AND ds.date BETWEEN ${startDate} AND ${endDate}
                GROUP BY b.id, b.name
            )
            SELECT 
                *,
                (sales - expenses) as profit
            FROM BusinessStats
            ORDER BY sales DESC
            LIMIT ${maxResults}
        `;

        return result.map(row => ({
            id: row.id,
            name: row.name,
            sales: Number(row.sales),
            expenses: Number(row.expenses),
            profit: Number(row.profit)
        }));
    }
}

module.exports = new ReportRepository();
