const sql = require('../db');

class ExpenseRepository {
    async findAll(userId, businessId, filters = {}) {
        const hasLimit = typeof filters.limit !== 'undefined';
        const limit = Number(filters.limit) || 0;
        const offset = Number(filters.offset) || 0;
        const hasCursor = filters.cursorDate && typeof filters.cursorId !== 'undefined';

        // Keyset pagination (cursor) — preferred for large tables
        if (hasLimit && hasCursor) {
            // keyset: (date, id) < (cursorDate, cursorId)
            const rows = await sql`
                SELECT id, date, description, amount
                FROM expenses
                WHERE business_id = ${businessId}
                  AND (date, id) < (${filters.cursorDate}, ${filters.cursorId})
                ORDER BY date DESC, id DESC
                LIMIT ${limit}
            `;

            // build nextCursor if needed
            const nextCursor = rows.length > 0 ? { date: rows[rows.length-1].date, id: rows[rows.length-1].id } : null;
            return { rows, nextCursor };
        }

        // Offset pagination (legacy / fallback)
        if (hasLimit) {
            let countQuery;
            let rows;
            if (filters.date) {
                countQuery = await sql`
                    SELECT COUNT(*)::int as total
                    FROM expenses
                    WHERE business_id = ${businessId} AND date = ${filters.date}
                `;

                rows = await sql`
                    SELECT id, date, description, amount
                    FROM expenses
                    WHERE business_id = ${businessId} AND date = ${filters.date}
                    ORDER BY date DESC, id DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;
            } else {
                countQuery = await sql`
                    SELECT COUNT(*)::int as total
                    FROM expenses
                    WHERE business_id = ${businessId}
                `;

                rows = await sql`
                    SELECT id, date, description, amount
                    FROM expenses
                    WHERE business_id = ${businessId}
                    ORDER BY date DESC, id DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;
            }

            return { rows, total: Number(countQuery[0].total || 0) };
        }

        if (filters.date) {
            return await sql`
                SELECT id, date, description, amount
                FROM expenses 
                WHERE business_id = ${businessId} AND date = ${filters.date}
                ORDER BY date DESC, id DESC
            `;
        }

        return await sql`
            SELECT id, date, description, amount
            FROM expenses 
            WHERE business_id = ${businessId}
            ORDER BY date DESC, id DESC
        `;
    }

    async create(expenseData, userId, businessId) {
        const { description, amount, date } = expenseData;
        const result = await sql`
            INSERT INTO expenses (user_id, business_id, description, amount, date) 
            VALUES (${userId}, ${businessId}, ${description}, ${amount}, COALESCE(${date}, CURRENT_DATE)) 
            RETURNING id, date, description, amount
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
            RETURNING id, date, description, amount
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
