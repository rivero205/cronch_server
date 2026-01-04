const productionRepository = require('../repositories/productionRepository');

class ProductionService {
    async getProduction(userId, businessId, filters = {}) {
        return await productionRepository.findAll(userId, businessId, filters);
    }

    async createProduction(userId, businessId, productionData) {
        // Validaciones de negocio
        if (!productionData.product_id) {
            throw new Error('Product ID is required');
        }
        if (!productionData.quantity || productionData.quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        if (!productionData.unit_cost || productionData.unit_cost <= 0) {
            throw new Error('Unit cost must be greater than 0');
        }

        return await productionRepository.create(productionData, userId, businessId);
    }

    async updateProduction(userId, businessId, id, productionData) {
        if (!productionData.product_id) {
            throw new Error('Product ID is required');
        }
        if (!productionData.quantity || productionData.quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        if (!productionData.unit_cost || productionData.unit_cost <= 0) {
            throw new Error('Unit cost must be greater than 0');
        }

        const updatedProduction = await productionRepository.update(id, productionData, userId, businessId);
        if (!updatedProduction) {
            throw new Error('Production record not found or access denied');
        }
        return updatedProduction;
    }

    async deleteProduction(userId, businessId, id) {
        const result = await productionRepository.delete(id, userId, businessId);
        if (!result) {
            throw new Error('Production record not found or access denied');
        }
        return { message: 'Production record deleted successfully' };
    }
}

module.exports = new ProductionService();
