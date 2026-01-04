const expenseRepository = require('../repositories/expenseRepository');
const salesRepository = require('../repositories/salesRepository');
const reportRepository = require('../repositories/reportRepository');
const Excel = require('exceljs');

const STYLES = {
    header: {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C3E50' } },
        alignment: { horizontal: 'center' }
    },
    currency: { numFmt: '"$"#,##0.00;[Red]\-"$"#,##0.00' },
    number: { numFmt: '#,##0' },
    totalRow: {
        font: { bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFECF0F1' } }
    },
    profit: {
        positive: { font: { color: { argb: 'FF27AE60' } } }, // Green
        negative: { font: { color: { argb: 'FFC0392B' } } }  // Red
    }
};

class ReportService {
    // Helper function to get week boundaries
    getWeekBoundaries(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        return {
            start: monday.toISOString().split('T')[0],
            end: sunday.toISOString().split('T')[0]
        };
    }

    async getWeeklyReport(userId, businessId, date) {
        if (!date) {
            throw new Error('Date is required');
        }

        const { start, end } = this.getWeekBoundaries(date);

        const totalSales = await salesRepository.sumByDateRange(userId, businessId, start, end);
        const totalExpenses = await expenseRepository.sumByDateRange(userId, businessId, start, end);

        const weeklyProfit = totalSales - totalExpenses;
        const dailyAverageSales = totalSales / 7;
        const dailyAverageProfit = weeklyProfit / 7;

        return {
            period: { start, end },
            totalSales,
            totalExpenses,
            weeklyProfit,
            dailyAverageSales,
            dailyAverageProfit
        };
    }

    async getMonthlyReport(userId, businessId, month) {
        if (!month) {
            throw new Error('Month is required (format: YYYY-MM)');
        }

        // Get first and last day of the month
        const [year, monthNum] = month.split('-');
        const firstDay = `${year}-${monthNum.padStart(2, '0')}-01`;
        const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
        const endDay = `${year}-${monthNum.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

        const totalSales = await salesRepository.sumByDateRange(userId, businessId, firstDay, endDay);
        const totalExpenses = await expenseRepository.sumByDateRange(userId, businessId, firstDay, endDay);

        const monthlyProfit = totalSales - totalExpenses;
        const dailyAverage = monthlyProfit / lastDay;

        return {
            month,
            period: { start: firstDay, end: endDay },
            totalSales,
            totalExpenses,
            monthlyProfit,
            dailyAverage,
            daysInMonth: lastDay
        };
    }

    async getProductProfitability(userId, businessId, startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('Start and end dates are required');
        }

        const products = await reportRepository.getProductProfitability(userId, businessId, startDate, endDate);

        return {
            period: { start: startDate, end: endDate },
            products
        };
    }

    async getDailyTrend(userId, businessId, startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('Start and end dates are required');
        }

        const dailyData = await reportRepository.getDailyTrend(userId, businessId, startDate, endDate);

        return {
            period: { start: startDate, end: endDate },
            dailyData
        };
    }

    async getMostProfitable(userId, businessId, startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('Start and end dates are required');
        }

        const product = await reportRepository.getMostProfitableProduct(userId, businessId, startDate, endDate);

        return {
            period: { start: startDate, end: endDate },
            product,
            message: product ? undefined : 'No hay productos rentables en este período'
        };
    }

    async getDailyReport(userId, businessId, date, startDate = null, endDate = null) {
        // Support both single date and date range
        const isRange = startDate && endDate;

        if (!isRange && !date) {
            throw new Error('Date is required');
        }

        let totalExpenses, totalSales, topProducts;

        if (isRange) {
            // Date range query for aggregated reports
            totalExpenses = await expenseRepository.sumByDateRange(userId, businessId, startDate, endDate);
            totalSales = await salesRepository.sumByDateRange(userId, businessId, startDate, endDate);
            topProducts = await salesRepository.getProductStatsByDateRange(userId, businessId, startDate, endDate);
        } else {
            // Single date query (backward compatible)
            totalExpenses = await expenseRepository.sumByDate(userId, businessId, date);
            totalSales = await salesRepository.sumByDate(userId, businessId, date);
            topProducts = await salesRepository.getProductStatsByDate(userId, businessId, date);
        }

        const dailyProfit = totalSales - totalExpenses;

        // Calculate daily average for range queries
        let daysInPeriod = 1;
        if (isRange) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            daysInPeriod = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
        }

        return {
            date: isRange ? null : date,
            period: isRange ? { start: startDate, end: endDate } : null,
            totalExpenses,
            totalSales,
            dailyProfit,
            dailyAverageSales: isRange ? totalSales / daysInPeriod : null,
            dailyAverageProfit: isRange ? dailyProfit / daysInPeriod : null,
            daysInPeriod: isRange ? daysInPeriod : null,
            topProducts
        };
    }

    // ========== DETAILED REPORTS FOR DOWNLOAD ==========

    async getDetailedWeeklyReport(userId, businessId, date) {
        if (!date) {
            throw new Error('Date is required');
        }

        const { start, end } = this.getWeekBoundaries(date);

        // Get summary data
        const totalSales = await salesRepository.sumByDateRange(userId, businessId, start, end);
        const totalExpenses = await expenseRepository.sumByDateRange(userId, businessId, start, end);
        const weeklyProfit = totalSales - totalExpenses;

        // Get detailed data
        const detailedData = await reportRepository.getDetailedWeeklyReport(userId, businessId, start, end);

        return {
            period: { start, end },
            summary: {
                totalSales,
                totalExpenses,
                weeklyProfit,
                dailyAverageSales: totalSales / 7,
                dailyAverageProfit: weeklyProfit / 7
            },
            details: detailedData
        };
    }

    async getDetailedMonthlyReport(userId, businessId, month) {
        if (!month) {
            throw new Error('Month is required (format: YYYY-MM)');
        }

        try {
            const [year, monthNum] = month.split('-');
            const firstDay = `${year}-${monthNum.padStart(2, '0')}-01`;
            const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
            const endDay = `${year}-${monthNum.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

            console.log('getDetailedMonthlyReport - Dates:', { firstDay, endDay, lastDay });

            // Get summary data
            const totalSales = await salesRepository.sumByDateRange(userId, businessId, firstDay, endDay);
            const totalExpenses = await expenseRepository.sumByDateRange(userId, businessId, firstDay, endDay);
            const monthlyProfit = totalSales - totalExpenses;

            console.log('getDetailedMonthlyReport - Summary:', { totalSales, totalExpenses, monthlyProfit });

            // Get detailed data
            const detailedData = await reportRepository.getDetailedMonthlyReport(userId, businessId, firstDay, endDay);

            console.log('getDetailedMonthlyReport - Detailed data received:', detailedData ? 'Yes' : 'No');

            return {
                month,
                period: { start: firstDay, end: endDay },
                summary: {
                    totalSales,
                    totalExpenses,
                    monthlyProfit,
                    dailyAverage: monthlyProfit / lastDay,
                    daysInMonth: lastDay
                },
                details: detailedData
            };
        } catch (error) {
            console.error('Error in getDetailedMonthlyReport:', error);
            throw error;
        }
    }

    async getDetailedProductProfitability(userId, businessId, startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('Start and end dates are required');
        }

        // Get summary
        const products = await reportRepository.getProductProfitability(userId, businessId, startDate, endDate);

        // Get detailed data
        const detailedData = await reportRepository.getDetailedProductProfitability(userId, businessId, startDate, endDate);

        return {
            period: { start: startDate, end: endDate },
            summary: { products },
            details: detailedData
        };
    }

    async getDetailedDailyTrend(userId, businessId, startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('Start and end dates are required');
        }

        const dailyData = await reportRepository.getDailyTrend(userId, businessId, startDate, endDate);
        const detailedData = await reportRepository.getDetailedWeeklyReport(userId, businessId, startDate, endDate);

        return {
            period: { start: startDate, end: endDate },
            summary: { dailyData },
            details: detailedData
        };
    }

    async getDetailedMostProfitable(userId, businessId, startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('Start and end dates are required');
        }

        const product = await reportRepository.getMostProfitableProduct(userId, businessId, startDate, endDate);
        const allProducts = await reportRepository.getProductProfitability(userId, businessId, startDate, endDate);

        return {
            period: { start: startDate, end: endDate },
            mostProfitable: product,
            allProducts: allProducts,
            message: product ? undefined : 'No hay productos rentables en este período'
        };
    };


    // ========== SUPER ADMIN GLOBAL REPORTS ==========

    async getGlobalSummary(startDate, endDate) {
        if (!startDate || !endDate) {
            throw new Error('Start and end dates are required');
        }
        return await reportRepository.getGlobalSummary(startDate, endDate);
    }

    async getBusinessRanking(startDate, endDate, maxResults) {
        if (!startDate || !endDate) {
            throw new Error('Start and end dates are required');
        }
        return await reportRepository.getBusinessRanking(startDate, endDate, maxResults);
    }

    // ========== EXCEL GENERATION HELPERS ==========

    _createWorkbook() {
        const workbook = new Excel.Workbook();
        workbook.creator = 'Cronch System';
        workbook.created = new Date();
        return workbook;
    }

    _applyHeaderStyle(sheet) {
        const headerRow = sheet.getRow(1);
        headerRow.font = STYLES.header.font;
        headerRow.fill = STYLES.header.fill;
        headerRow.alignment = STYLES.header.alignment;
        headerRow.commit();
    }

    _autoWidth(sheet) {
        sheet.columns.forEach(column => {
            let maxLength = 0;
            if (column.header) {
                maxLength = column.header.length;
            }
            // Iterate over all rows (including the header, but strictly speaking checking data)
            // But exceljs isn't auto-calculating strictly, so we do a rough estimation or leave as is if simple.
            // A simple fixed width is often safer and faster.
            column.width = Math.max(maxLength + 2, 15);
        });
    }

    // ========== EXCEL REPORTS ==========

    async generateWeeklyExcel(userId, businessId, date) {
        const data = await this.getDetailedWeeklyReport(userId, businessId, date);
        const workbook = this._createWorkbook();
        const sheet = workbook.addWorksheet('Reporte Semanal');

        sheet.columns = [
            { header: 'Fecha', key: 'date', width: 15 },
            { header: 'Ventas', key: 'sales', style: STYLES.currency, width: 15 },
            { header: 'Gastos', key: 'expenses', style: STYLES.currency, width: 15 },
            { header: 'Ganancia', key: 'profit', style: STYLES.currency, width: 15 },
            { header: 'Transacciones', key: 'transactions', style: STYLES.number, width: 15 }
        ];

        this._applyHeaderStyle(sheet);

        // Add Data
        const dailyData = data.details.dailySummary;
        dailyData.forEach(day => {
            const row = sheet.addRow({
                date: day.date,
                sales: parseFloat(day.sales), // Note: dailySummary uses 'sales'/'expenses' not 'totalSales'/'totalExpenses'
                expenses: parseFloat(day.expenses),
                profit: parseFloat(day.profit),
                transactions: 0 // dailySummary might not have transactionCount, checking repository...
            });

            // Colorize profit
            if (day.profit < 0) row.getCell('profit').font = STYLES.profit.negative.font;
            else row.getCell('profit').font = STYLES.profit.positive.font;
        });

        // Add Totals
        // Re-calculate totals from array to be safe, or use summary
        const totalRow = sheet.addRow({
            date: 'TOTALES',
            sales: parseFloat(data.summary.totalSales),
            expenses: parseFloat(data.summary.totalExpenses),
            profit: parseFloat(data.summary.weeklyProfit),
            transactions: 0 // Placeholder
        });

        // Apply Total Style
        ['A', 'B', 'C', 'D', 'E'].forEach(col => {
            const cell = totalRow.getCell(col);
            cell.fill = STYLES.totalRow.fill;
            cell.font = STYLES.totalRow.font;
            if (col === 'D') { // Profit column
                if (data.summary.weeklyProfit < 0) cell.font = { ...STYLES.totalRow.font, ...STYLES.profit.negative.font };
                else cell.font = { ...STYLES.totalRow.font, ...STYLES.profit.positive.font };
            }
        });

        return workbook;
    }

    async generateMonthlyExcel(userId, businessId, month) {
        const data = await this.getDetailedMonthlyReport(userId, businessId, month);
        const workbook = this._createWorkbook();
        const sheet = workbook.addWorksheet('Reporte Mensual');

        sheet.columns = [
            { header: 'Fecha', key: 'date', width: 15 },
            { header: 'Ventas', key: 'sales', style: STYLES.currency, width: 15 },
            { header: 'Gastos', key: 'expenses', style: STYLES.currency, width: 15 },
            { header: 'Ganancia', key: 'profit', style: STYLES.currency, width: 15 },
            { header: 'Transacciones', key: 'transactions', style: STYLES.number, width: 15 }
        ];

        this._applyHeaderStyle(sheet);

        if (data.details && data.details.dailySummary) {
            data.details.dailySummary.forEach(day => {
                const row = sheet.addRow({
                    date: day.date,
                    sales: parseFloat(day.sales),
                    expenses: parseFloat(day.expenses),
                    profit: parseFloat(day.profit),
                    transactions: 0
                });

                if (day.profit < 0) row.getCell('profit').font = STYLES.profit.negative.font;
                else row.getCell('profit').font = STYLES.profit.positive.font;
            });
        }

        const totalRow = sheet.addRow({
            date: 'TOTALES',
            sales: parseFloat(data.summary.totalSales),
            expenses: parseFloat(data.summary.totalExpenses),
            profit: parseFloat(data.summary.monthlyProfit),
            transactions: 0
        });

        ['A', 'B', 'C', 'D', 'E'].forEach(col => {
            const cell = totalRow.getCell(col);
            cell.fill = STYLES.totalRow.fill;
            cell.font = STYLES.totalRow.font;
            if (col === 'D') {
                if (data.summary.monthlyProfit < 0) cell.font = { ...STYLES.totalRow.font, ...STYLES.profit.negative.font };
                else cell.font = { ...STYLES.totalRow.font, ...STYLES.profit.positive.font };
            }
        });

        return workbook;
    }

    async generateProductProfitabilityExcel(userId, businessId, startDate, endDate) {
        const data = await this.getDetailedProductProfitability(userId, businessId, startDate, endDate);
        const workbook = this._createWorkbook();
        const sheet = workbook.addWorksheet('Rentabilidad Productos');

        sheet.columns = [
            { header: 'Producto', key: 'name', width: 30 },
            { header: 'Cantidad', key: 'quantity', style: STYLES.number, width: 15 },
            { header: 'Ingresos', key: 'revenue', style: STYLES.currency, width: 15 },
            { header: 'Costos', key: 'costs', style: STYLES.currency, width: 15 },
            { header: 'Ganancia', key: 'profit', style: STYLES.currency, width: 15 },
            { header: 'Margen %', key: 'margin', width: 15 }
        ];

        this._applyHeaderStyle(sheet);

        let totalQuantity = 0;
        let totalRevenue = 0;
        let totalCosts = 0;
        let totalProfit = 0;

        // Use summary.products which contains the profitability list
        if (data.summary && data.summary.products) {
            data.summary.products.forEach(item => {
                const profit = parseFloat(item.profit);
                const revenue = parseFloat(item.totalSales);
                const costs = parseFloat(item.productionCost);
                const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

                totalQuantity += parseInt(item.quantitySold);
                totalRevenue += revenue;
                totalCosts += costs;
                totalProfit += profit;

                const row = sheet.addRow({
                    name: item.name,
                    quantity: parseInt(item.quantitySold),
                    revenue: revenue,
                    costs: costs,
                    profit: profit,
                    margin: margin.toFixed(2) + '%'
                });

                if (profit < 0) row.getCell('profit').font = STYLES.profit.negative.font;
                else row.getCell('profit').font = STYLES.profit.positive.font;
            });
        }

        const totalRow = sheet.addRow({
            name: 'TOTALES',
            quantity: totalQuantity,
            revenue: totalRevenue,
            costs: totalCosts,
            profit: totalProfit,
            margin: totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(2) + '%' : '0.00%'
        });

        ['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
            const cell = totalRow.getCell(col);
            cell.fill = STYLES.totalRow.fill;
            cell.font = STYLES.totalRow.font;
            if (col === 'E') {
                if (totalProfit < 0) cell.font = { ...STYLES.totalRow.font, ...STYLES.profit.negative.font };
                else cell.font = { ...STYLES.totalRow.font, ...STYLES.profit.positive.font };
            }
        });

        return workbook;
    }

    async generateDailyTrendExcel(userId, businessId, startDate, endDate) {
        const data = await this.getDetailedDailyTrend(userId, businessId, startDate, endDate);
        const workbook = this._createWorkbook();
        const sheet = workbook.addWorksheet('Tendencia Diaria');

        sheet.columns = [
            { header: 'Fecha', key: 'date', width: 15 },
            { header: 'Ventas', key: 'sales', style: STYLES.currency, width: 15 },
            { header: 'Gastos', key: 'expenses', style: STYLES.currency, width: 15 },
            { header: 'Ganancia', key: 'profit', style: STYLES.currency, width: 15 }
        ];

        this._applyHeaderStyle(sheet);

        if (data.summary && data.summary.dailyData) {
            data.summary.dailyData.forEach(day => {
                const row = sheet.addRow({
                    date: day.date,
                    sales: parseFloat(day.sales),
                    expenses: parseFloat(day.expenses),
                    profit: parseFloat(day.profit)
                });

                if (parseFloat(day.profit) < 0) row.getCell('profit').font = STYLES.profit.negative.font;
                else row.getCell('profit').font = STYLES.profit.positive.font;
            });
        }

        return workbook;
    }

    async generateMostProfitableExcel(userId, businessId, startDate, endDate) {
        const data = await this.getDetailedMostProfitable(userId, businessId, startDate, endDate);
        const workbook = this._createWorkbook();
        const sheet = workbook.addWorksheet('Más Rentable');

        // This report is simpler, maybe just a summary of the top product vs others?
        // Or just a list of all products sorted by profitability (which is what allProducts usually is)

        sheet.columns = [
            { header: 'Producto', key: 'name', width: 30 },
            { header: 'Ganancia Total', key: 'profit', style: STYLES.currency, width: 15 },
            { header: 'Ventas Totales', key: 'sales', style: STYLES.currency, width: 15 }
        ];

        this._applyHeaderStyle(sheet);

        if (data.allProducts) {
            // Sort just in case
            const sorted = [...data.allProducts].sort((a, b) => parseFloat(b.totalProfit) - parseFloat(a.totalProfit));

            sorted.forEach((item, index) => {
                const row = sheet.addRow({
                    name: item.name,
                    profit: parseFloat(item.totalProfit),
                    sales: parseFloat(item.totalRevenue)
                });

                // Highlight the winner
                if (index === 0) {
                    row.eachCell(cell => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDFF0D8' } }; // Light green
                        cell.font = { bold: true };
                    });
                }
            });
        }

        return workbook;
    }

}

module.exports = new ReportService();
