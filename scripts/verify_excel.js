const reportService = require('../services/reportService');
const reportRepository = require('../repositories/reportRepository');
const salesRepository = require('../repositories/salesRepository');
const expenseRepository = require('../repositories/expenseRepository');
const fs = require('fs');
const path = require('path');

// Mock data
const mockDailyDetails = [
    { date: '2023-10-23', sales: 1000, expenses: 500, profit: 500 },
    { date: '2023-10-24', sales: 1500, expenses: 1600, profit: -100 }
];

const mockSummary = {
    totalSales: 2500,
    totalExpenses: 2100,
    weeklyProfit: 400,
    monthlyProfit: 400
};

const mockProductData = [
    { name: 'Pizza', quantitySold: 50, totalSales: 1000, productionCost: 500, profit: 500 }
];

const mockDailyTrendData = [
    { date: '2023-10-23', sales: 1000, expenses: 500, profit: 500 },
    { date: '2023-10-24', sales: 1500, expenses: 1600, profit: -100 }
];

// Mock repository methods
// getDetailedWeeklyReport returns { dailySummary, ... }
reportService.getDetailedWeeklyReport = async () => ({
    period: { start: '2023-10-23', end: '2023-10-29' },
    summary: mockSummary,
    details: { dailySummary: mockDailyDetails }
});

reportService.getDetailedMonthlyReport = async () => ({
    period: { start: '2023-10-01', end: '2023-10-31' },
    summary: mockSummary,
    details: { dailySummary: mockDailyDetails }
});

reportService.getDetailedProductProfitability = async () => ({
    period: {},
    summary: { products: mockProductData },
    details: {}
});

reportService.getDetailedDailyTrend = async () => ({
    period: {},
    summary: { dailyData: mockDailyTrendData },
    details: {}
});

reportService.getDetailedMostProfitable = async () => ({
    period: {},
    allProducts: mockProductData
});

async function verify() {
    console.log('Starting Excel generation verification...');

    try {
        // Weekly
        console.log('Generating Weekly Report...');
        const weeklyWorkbook = await reportService.generateWeeklyExcel('2023-10-23');
        await weeklyWorkbook.xlsx.writeFile('weekly_test.xlsx');
        console.log('Weekly Report generated: weekly_test.xlsx');

        // Monthly
        console.log('Generating Monthly Report...');
        const monthlyWorkbook = await reportService.generateMonthlyExcel('2023-10');
        await monthlyWorkbook.xlsx.writeFile('monthly_test.xlsx');
        console.log('Monthly Report generated: monthly_test.xlsx');

        // Products
        console.log('Generating Product Report...');
        const productWorkbook = await reportService.generateProductProfitabilityExcel('2023-10-01', '2023-10-31');
        await productWorkbook.xlsx.writeFile('products_test.xlsx');
        console.log('Product Report generated: products_test.xlsx');

        // Daily Trend
        console.log('Generating Daily Trend Report...');
        const trendWorkbook = await reportService.generateDailyTrendExcel('2023-10-01', '2023-10-31');
        await trendWorkbook.xlsx.writeFile('trend_test.xlsx');
        console.log('Daily Trend Report generated: trend_test.xlsx');

        console.log('VERIFICATION SUCCESSFUL');
    } catch (err) {
        console.error('VERIFICATION FAILED', err);
        process.exit(1);
    }
}

verify();
