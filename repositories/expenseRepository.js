const sql = require('../db');

class ExpenseRepository {
    async findAll(userId, businessId, filters = {}) {
        if (filters.date) {
            return await sql`
                SELECT * FROM expenses 
                WHERE business_id = ${businessId} AND date = ${filters.date}
                ORDER BY id DESC
            `;
        }

        return await sql`
            SELECT * FROM expenses 
            WHERE business_id = ${businessId}
            ORDER BY id DESC
        `;
    }

    async create(expenseData, userId, businessId) {
        const { description, amount, date } = expenseData;
        const result = await sql`
            INSERT INTO expenses (user_id, business_id, description, amount, date) 
            VALUES (${userId}, ${businessId}, ${description}, ${amount}, COALESCE(${date}, CURRENT_DATE)) 
            RETURNING *
        `;
        return result[0];
    }

    async sumByDateRange(userId, businessId, startDate, endDate) {
        const result = await sql`
            SELECT SUM(amount) as total_expenses 
            FROM expenses 
            WHERE business_id = ${businessId} AND date BETWEEN ${startDate} AND ${endDate}
        `;
        return Number(result[0].total_expenses || 0);
    }

    async sumByDate(userId, businessId, date) {
        const result = await sql`
            SELECT SUM(amount) as total_expenses 
            FROM expenses 
            WHERE business_id = ${businessId} AND date = ${date}
        `;
        return Number(result[0].total_expenses || 0);
    }
    async update(id, expenseData, userId, businessId) {
        const { description, amount, date } = expenseData;
        const result = await sql`
            UPDATE expenses 
            SET description = ${description}, amount = ${amount}, date = ${date}
            WHERE id = ${id} AND business_id = ${businessId}
            RETURNING *
        `;
        return result[0];
    }

    async delete(id, userId, businessId) {
        const result = await sql`
            DELETE FROM expenses 
            WHERE id = ${id} AND business_id = ${businessId}
            RETURNING id
        `;
        return result.length > 0;
    }
}

module.exports = new ExpenseRepository();
