const express = require('express');
const router = express.Router();
const productService = require('../services/productService');
const { validateProduct } = require('../middleware/validators');

const checkRole = require('../middleware/roleMiddleware');

// Apply Role Check (Super Admin, Admin, Manager)
router.use(checkRole(['super_admin', 'admin', 'manager']));

// GET /api/products
router.get('/', async (req, res) => {
    try {
        const products = await productService.getAllProducts(req.user.id, req.user.business_id);
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/products
router.post('/', validateProduct, async (req, res) => {
    try {
        const product = await productService.createProduct(req.user.id, req.user.business_id, req.body);
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// PUT /api/products/:id
router.put('/:id', validateProduct, async (req, res) => {
    try {
        const product = await productService.updateProduct(req.user.id, req.user.business_id, req.params.id, req.body);
        res.json(product);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
    try {
        const result = await productService.deleteProduct(req.user.id, req.user.business_id, req.params.id);
        res.json(result);
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
