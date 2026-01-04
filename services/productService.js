const productRepository = require('../repositories/productRepository');

class ProductService {
    async getAllProducts(userId, businessId) {
        return await productRepository.findAll(userId, businessId);
    }

    async getProductById(userId, businessId, id) {
        return await productRepository.findById(id, userId, businessId);
    }

    async createProduct(userId, businessId, productData) {
        // Validations
        if (!productData.name || productData.name.trim() === '') {
            throw new Error('Product name is required');
        }
        if (!productData.type || productData.type.trim() === '') {
            throw new Error('Product type is required');
        }

        return await productRepository.create(productData, userId, businessId);
    }

    async updateProduct(userId, businessId, id, productData) {
        // Validations
        if (!productData.name || productData.name.trim() === '') {
            throw new Error('Product name is required');
        }
        if (!productData.type || productData.type.trim() === '') {
            throw new Error('Product type is required');
        }

        const updatedProduct = await productRepository.update(id, productData, userId, businessId);
        if (!updatedProduct) {
            throw new Error('Product not found or access denied');
        }
        return updatedProduct;
    }

    async deleteProduct(userId, businessId, id) {
        const result = await productRepository.delete(id, userId, businessId);
        if (!result) {
            throw new Error('Product not found or access denied');
        }
        return { message: 'Product deleted successfully' };
    }
}

module.exports = new ProductService();
