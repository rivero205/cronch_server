const sql = require('../db');

class ProductionRepository {
    async findAll(userId, businessId, filters = {}) {
        const hasLimit = typeof filters.limit !== 'undefined';
        const limit = Number(filters.limit) || 0;
        const offset = Number(filters.offset) || 0;
        const hasCursor = filters.cursorDate && typeof filters.cursorId !== 'undefined';

        if (hasLimit && hasCursor) {
            const rows = await sql`
                SELECT dp.id, dp.date, dp.quantity, dp.unit_cost, p.name as product_name
                FROM daily_production dp
                JOIN products p ON dp.product_id = p.id
                WHERE dp.business_id = ${businessId}
                  AND (dp.date, dp.id) < (${filters.cursorDate}, ${filters.cursorId})
                ORDER BY dp.date DESC, dp.id DESC
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
                    FROM daily_production dp
                    WHERE dp.business_id = ${businessId} AND dp.date = ${filters.date}
                `;

                rows = await sql`
                    SELECT dp.id, dp.date, dp.quantity, dp.unit_cost, p.name as product_name
                    FROM daily_production dp
                    JOIN products p ON dp.product_id = p.id
                    WHERE dp.business_id = ${businessId} AND dp.date = ${filters.date}
                    ORDER BY dp.date DESC, dp.id DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;
            } else {
                countQuery = await sql`
                    SELECT COUNT(*)::int as total
                    FROM daily_production dp
                    WHERE dp.business_id = ${businessId}
                `;

                rows = await sql`
                    SELECT dp.id, dp.date, dp.quantity, dp.unit_cost, p.name as product_name
                    FROM daily_production dp
                    JOIN products p ON dp.product_id = p.id
                    WHERE dp.business_id = ${businessId}
                    ORDER BY dp.date DESC, dp.id DESC
                    LIMIT ${limit} OFFSET ${offset}
                `;
            }

            return { rows, total: Number(countQuery[0].total || 0) };
        }

        if (filters.date) {
            return await sql`
                SELECT dp.id, dp.date, dp.quantity, dp.unit_cost, p.name as product_name
                FROM daily_production dp
                JOIN products p ON dp.product_id = p.id
                WHERE dp.business_id = ${businessId} AND dp.date = ${filters.date}
                ORDER BY dp.date DESC, dp.id DESC
            `;
        }

        return await sql`
            SELECT dp.id, dp.date, dp.quantity, dp.unit_cost, p.name as product_name
            FROM daily_production dp
            JOIN products p ON dp.product_id = p.id
            WHERE dp.business_id = ${businessId}
            ORDER BY dp.date DESC, dp.id DESC
        `;
    }

    async create(productionData, userId, businessId) {
        const { product_id, quantity, unit_cost, date } = productionData;
        const result = await sql`
            INSERT INTO daily_production (user_id, business_id, product_id, quantity, unit_cost, date) 
            VALUES (${userId}, ${businessId}, ${product_id}, ${quantity}, ${unit_cost}, COALESCE(${date}, CURRENT_DATE)) 
            RETURNING id, date, product_id, quantity, unit_cost
        `;
        return result[0];
    }
    async update(id, productionData, userId, businessId) {
        const { product_id, quantity, unit_cost, date } = productionData;
        const result = await sql`
            UPDATE daily_production 
            SET product_id = ${product_id}, quantity = ${quantity}, unit_cost = ${unit_cost}, date = ${date}
            WHERE id = ${id} AND business_id = ${businessId}
            RETURNING id, date, product_id, quantity, unit_cost
        `;
        return result[0];
    }

    async delete(id, userId, businessId) {
        const result = await sql`
            DELETE FROM daily_production 
            WHERE id = ${id} AND business_id = ${businessId}
            RETURNING id
        `;
        return result.length > 0;
    }
}

module.exports = new ProductionRepository();
