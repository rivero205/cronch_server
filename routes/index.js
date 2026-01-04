const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Import route modules
const productRoutes = require('./productRoutes');
const expenseRoutes = require('./expenseRoutes');
const productionRoutes = require('./productionRoutes');
const salesRoutes = require('./salesRoutes');
const reportRoutes = require('./reportRoutes');
const businessRoutes = require('./businessRoutes');
const userRoutes = require('./userRoutes');

// Public routes (Business list for registration)
router.use('/businesses', businessRoutes);

// Apply auth middleware to all routes below
router.use(authMiddleware);

// Mount protected routes
router.use('/products', productRoutes);
router.use('/expenses', expenseRoutes);
router.use('/production', productionRoutes);
router.use('/sales', salesRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);

module.exports = router;
