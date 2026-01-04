const salesRepository = require('../repositories/salesRepository');

class SalesService {
    async getSales(userId, businessId, filters = {}) {
        return await salesRepository.findAll(userId, businessId, filters);
    }

    async createSale(userId, businessId, saleData) {
        // Validaciones de negocio
        if (!saleData.product_id) {
            throw new Error('Product ID is required');
        }
        if (!saleData.quantity || saleData.quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        if (!saleData.unit_price || saleData.unit_price <= 0) {
            throw new Error('Unit price must be greater than 0');
        }

        return await salesRepository.create(saleData, userId, businessId);
    }

    async updateSale(userId, businessId, id, saleData) {
        if (!saleData.product_id) {
            throw new Error('Product ID is required');
        }
        if (!saleData.quantity || saleData.quantity <= 0) {
            throw new Error('Quantity must be greater than 0');
        }
        if (!saleData.unit_price || saleData.unit_price <= 0) {
            throw new Error('Unit price must be greater than 0');
        }

        const updatedSale = await salesRepository.update(id, saleData, userId, businessId);
        if (!updatedSale) {
            throw new Error('Sale record not found or access denied');
        }
        return updatedSale;
    }

    async deleteSale(userId, businessId, id) {
        const result = await salesRepository.delete(id, userId, businessId);
        if (!result) {
            throw new Error('Sale record not found or access denied');
        }
        return { message: 'Sale record deleted successfully' };
    }
}

module.exports = new SalesService();
