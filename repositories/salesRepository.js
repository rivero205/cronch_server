const sql = require('../db');

class SalesRepository {
    async findAll(userId, businessId, filters = {}) {
        const hasLimit = typeof filters.limit !== 'undefined';
        const limit = Number(filters.limit) || 0;
        const offset = Number(filters.offset) || 0;
        const hasCursor = filters.cursorDate && typeof filters.cursorId !== 'undefined';

        if (hasLimit && hasCursor) {
            const rows = await sql`
                SELECT ds.id, ds.date, ds.quantity, ds.unit_price, p.name as product_name
                FROM daily_sales ds
                JOIN products p ON ds.product_id = p.id
                WHERE ds.business_id = ${businessId}
                  AND (ds.date, ds.id) < (${filters.cursorDate}, ${filters.cursorId})
                ORDER BY ds.date DESC, ds.id DESC
                LIMIT ${limit}
            `;
            const nextCursor = rows.length > 0 ? { date: rows[rows.length-1].date, id: rows[rows.length-1].id } : null;
            return { rows, nextCursor };
        }

        if (hasLimit) {
            let countQuery;
            let rows;
            if (filters.date) {
                countQuery = await sql`
                    SELECT COUNT(*)::int as total
                    FROM daily_sales ds
                    WHERE ds.business_id = ${businessId} AND ds.date = ${filters.date}
                `;

                rows = await sql`
                    SELECT ds.id, ds.date, ds.quantity, ds.unit_price, p.name as product_name
                    FROM daily_sales ds
                    JOIN products p ON ds.product_id = p.id
                    WHERE ds.business_id = ${businessId} AND ds.date = ${filters.date}
                    ORDER BY ds.date DESC, ds.id DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;
            } else {
                countQuery = await sql`
                    SELECT COUNT(*)::int as total
                    FROM daily_sales ds
                    WHERE ds.business_id = ${businessId}
                `;

                rows = await sql`
                    SELECT ds.id, ds.date, ds.quantity, ds.unit_price, p.name as product_name
                    FROM daily_sales ds
                    JOIN products p ON ds.product_id = p.id
                    WHERE ds.business_id = ${businessId}
                    ORDER BY ds.date DESC, ds.id DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;
            }

            return { rows, total: Number(countQuery[0].total || 0) };
        }

        if (filters.date) {
            return await sql`
                SELECT ds.id, ds.date, ds.quantity, ds.unit_price, p.name as product_name 
                FROM daily_sales ds 
                JOIN products p ON ds.product_id = p.id
                WHERE ds.business_id = ${businessId} AND ds.date = ${filters.date}
                ORDER BY ds.date DESC, ds.id DESC
            `;
        }

        return await sql`
            SELECT ds.id, ds.date, ds.quantity, ds.unit_price, p.name as product_name 
            FROM daily_sales ds 
            JOIN products p ON ds.product_id = p.id
            WHERE ds.business_id = ${businessId}
            ORDER BY ds.date DESC, ds.id DESC
        `;
    }

    async create(saleData, userId, businessId) {
        const { product_id, quantity, unit_price, date } = saleData;
        const result = await sql`
            INSERT INTO daily_sales (user_id, business_id, product_id, quantity, unit_price, date) 
            VALUES (${userId}, ${businessId}, ${product_id}, ${quantity}, ${unit_price}, COALESCE(${date}, CURRENT_DATE)) 
            RETURNING id, date, product_id, quantity, unit_price
        `;
        return result[0];
    }

    async sumByDateRange(userId, businessId, startDate, endDate) {
        const result = await sql`
            SELECT SUM(quantity * unit_price) as total_sales 
            FROM daily_sales 
            WHERE business_id = ${businessId} AND date BETWEEN ${startDate} AND ${endDate}
        `;
        return Number(result[0].total_sales || 0);
    }

    async sumByDate(userId, businessId, date) {
        const result = await sql`
            SELECT SUM(quantity * unit_price) as total_sales 
            FROM daily_sales 
            WHERE business_id = ${businessId} AND date = ${date}
        `;
        return Number(result[0].total_sales || 0);
    }

    async getProductStatsByDate(userId, businessId, date) {
        return await sql`
            SELECT 
                p.name, 
                SUM(ds.quantity * ds.unit_price) as sales_amount,
                SUM(ds.quantity) as quantity_sold
            FROM daily_sales ds
            JOIN products p ON ds.product_id = p.id
            WHERE ds.business_id = ${businessId} AND ds.date = ${date}
            GROUP BY p.id, p.name
            ORDER BY sales_amount DESC
        `;
    }

    async getProductStatsByDateRange(userId, businessId, startDate, endDate) {
        return await sql`
            SELECT 
                p.name, 
                SUM(ds.quantity * ds.unit_price) as sales_amount,
                SUM(ds.quantity) as quantity_sold
            FROM daily_sales ds
            JOIN products p ON ds.product_id = p.id
            WHERE ds.business_id = ${businessId} AND ds.date BETWEEN ${startDate} AND ${endDate}
            GROUP BY p.id, p.name
            ORDER BY sales_amount DESC
        `;
    }
    async update(id, saleData, userId, businessId) {
        const { product_id, quantity, unit_price, date } = saleData;
        const result = await sql`
            UPDATE daily_sales 
            SET product_id = ${product_id}, quantity = ${quantity}, unit_price = ${unit_price}, date = ${date}
            WHERE id = ${id} AND business_id = ${businessId}
            RETURNING id, date, product_id, quantity, unit_price
        `;
        return result[0];
    }

    async delete(id, userId, businessId) {
        const result = await sql`
            DELETE FROM daily_sales 
            WHERE id = ${id} AND business_id = ${businessId}
            RETURNING id
        `;
        return result.length > 0;
    }
}

module.exports = new SalesRepository();
