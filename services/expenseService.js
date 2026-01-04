const expenseRepository = require('../repositories/expenseRepository');

class ExpenseService {
    async getExpenses(userId, businessId, filters = {}) {
        return await expenseRepository.findAll(userId, businessId, filters);
    }

    async createExpense(userId, businessId, expenseData) {
        // Aquí se puede agregar validaciones de negocio
        if (!expenseData.description || expenseData.description.trim() === '') {
            throw new Error('Description is required');
        }
        if (!expenseData.amount || expenseData.amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }

        return await expenseRepository.create(expenseData, userId, businessId);
    }

    async updateExpense(userId, businessId, id, expenseData) {
        if (!expenseData.description || expenseData.description.trim() === '') {
            throw new Error('Description is required');
        }
        if (!expenseData.amount || expenseData.amount <= 0) {
            throw new Error('Amount must be greater than 0');
        }

        const updatedExpense = await expenseRepository.update(id, expenseData, userId, businessId);
        if (!updatedExpense) {
            throw new Error('Expense not found or access denied');
        }
        return updatedExpense;
    }

    async deleteExpense(userId, businessId, id) {
        const result = await expenseRepository.delete(id, userId, businessId);
        if (!result) {
            throw new Error('Expense not found or access denied');
        }
        return { message: 'Expense deleted successfully' };
    }
}

module.exports = new ExpenseService();
