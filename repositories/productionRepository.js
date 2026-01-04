const sql = require('../db');

class ProductionRepository {
    async findAll(userId, businessId, filters = {}) {
        if (filters.date) {
            return await sql`
                SELECT dp.*, p.name as product_name 
                FROM daily_production dp 
                JOIN products p ON dp.product_id = p.id
                WHERE dp.business_id = ${businessId} AND dp.date = ${filters.date}
                ORDER BY dp.id DESC
            `;
        }

        return await sql`
            SELECT dp.*, p.name as product_name 
            FROM daily_production dp 
            JOIN products p ON dp.product_id = p.id
            WHERE dp.business_id = ${businessId}
            ORDER BY dp.id DESC
        `;
    }

    async create(productionData, userId, businessId) {
        const { product_id, quantity, unit_cost, date } = productionData;
        const result = await sql`
            INSERT INTO daily_production (user_id, business_id, product_id, quantity, unit_cost, date) 
            VALUES (${userId}, ${businessId}, ${product_id}, ${quantity}, ${unit_cost}, COALESCE(${date}, CURRENT_DATE)) 
            RETURNING *
        `;
        return result[0];
    }
    async update(id, productionData, userId, businessId) {
        const { product_id, quantity, unit_cost, date } = productionData;
        const result = await sql`
            UPDATE daily_production 
            SET product_id = ${product_id}, quantity = ${quantity}, unit_cost = ${unit_cost}, date = ${date}
            WHERE id = ${id} AND business_id = ${businessId}
            RETURNING *
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
