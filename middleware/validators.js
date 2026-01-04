const { body, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    next();
};

// Product validators
const validateProduct = [
    body('name')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ max: 100 }).withMessage('Name must be under 100 characters')
        .escape(),
    body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    handleValidationErrors
];

// Expense validators
const validateExpense = [
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 255 }).withMessage('Description must be under 255 characters')
        .escape(),
    body('amount')
        .notEmpty().withMessage('Amount is required')
        .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
    body('date')
        .notEmpty().withMessage('Date is required')
        .isISO8601().withMessage('Date must be valid (YYYY-MM-DD)'),
    handleValidationErrors
];

// Production validators
const validateProduction = [
    body('product_id')
        .notEmpty().withMessage('Product ID is required')
        .isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    body('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('unit_cost')
        .notEmpty().withMessage('Unit cost is required')
        .isFloat({ min: 0 }).withMessage('Unit cost must be a positive number'),
    body('date')
        .notEmpty().withMessage('Date is required')
        .isISO8601().withMessage('Date must be valid (YYYY-MM-DD)'),
    handleValidationErrors
];

// Sale validators
const validateSale = [
    body('product_id')
        .notEmpty().withMessage('Product ID is required')
        .isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    body('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('unit_price')
        .notEmpty().withMessage('Unit price is required')
        .isFloat({ min: 0.01 }).withMessage('Unit price must be greater than 0'),
    body('date')
        .notEmpty().withMessage('Date is required')
        .isISO8601().withMessage('Date must be valid (YYYY-MM-DD)'),
    handleValidationErrors
];

module.exports = {
    validateProduct,
    validateExpense,
    validateProduction,
    validateSale,
    handleValidationErrors
};
