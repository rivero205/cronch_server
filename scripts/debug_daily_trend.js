const reportService = require('../services/reportService');
const db = require('../db');

async function debug() {
    console.log('Testing getDailyTrend...');
    try {
        const result = await reportService.getDailyTrend('2025-12-16', '2025-12-22');
        console.log('Success:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error caught in debug script:', err);
    } finally {
        // Close DB connection if possible, though db.js uses a pool which might not export close.
        // We will just let the script exit.
        process.exit();
    }
}

debug();
