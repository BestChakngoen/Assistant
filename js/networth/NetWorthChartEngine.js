/**
 * NetWorthChartEngine.js - Chart Rendering Engine for Net Worth Tracker
 * Clean OOP architecture for Pie/Donut Chart & 52-Week History Line Chart
 */
export class NetWorthChartEngine {
    static initCategoryPieChart(manager, canvasId, chartPropName, defaultColors) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof Chart === 'undefined') return;
        const ctx = canvas.getContext('2d');

        if (manager[chartPropName]) {
            manager[chartPropName].destroy();
        }

        manager[chartPropName] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: defaultColors,
                    borderColor: '#0f172a',
                    borderWidth: 2,
                    hoverOffset: 4
                }]
            },
            options: {
                animation: false,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#94a3b8',
                            font: { family: 'Rajdhani', size: 10, weight: 'bold' },
                            padding: 8,
                            boxWidth: 10
                        }
                    },
                    datalabels: {
                        color: '#ffffff',
                        font: { family: 'Rajdhani', size: 10, weight: 'bold' },
                        formatter: (value, ctx) => {
                            const sum = ctx.dataset.data.reduce((a, b) => a + b, 0);
                            if (sum === 0 || value === 0) return '';
                            const pct = ((value / sum) * 100).toFixed(1);
                            return `${pct}%`;
                        }
                    }
                },
                cutout: '65%'
            }
        });
    }

    static updateCategoryPieCharts(manager) {
        const assetColors = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
        const liabilityColors = ['#ef4444', '#f97316', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'];

        if (!manager.assetPieChart) {
            this.initCategoryPieChart(manager, 'nwAssetPieChart', 'assetPieChart', assetColors);
        }
        if (!manager.liabilityPieChart) {
            this.initCategoryPieChart(manager, 'nwLiabilityPieChart', 'liabilityPieChart', liabilityColors);
        }

        // Group items by Category for ASSET
        const assetTotalsByCategory = {};
        const liabilityTotalsByCategory = {};

        manager.items.forEach(item => {
            const amt = manager.getItemConvertedAmount(item);
            const cat = item.category || 'Other';
            if (item.type === 'ASSET') {
                assetTotalsByCategory[cat] = (assetTotalsByCategory[cat] || 0) + amt;
            } else if (item.type === 'LIABILITY') {
                liabilityTotalsByCategory[cat] = (liabilityTotalsByCategory[cat] || 0) + amt;
            }
        });

        // Update Assets Pie Chart
        if (manager.assetPieChart) {
            const assetLabels = Object.keys(assetTotalsByCategory);
            const assetData = Object.values(assetTotalsByCategory);
            manager.assetPieChart.data.labels = assetLabels.length > 0 ? assetLabels : ['No Assets'];
            manager.assetPieChart.data.datasets[0].data = assetData.length > 0 ? assetData : [1];
            manager.assetPieChart.data.datasets[0].backgroundColor = assetLabels.length > 0 ? assetColors.slice(0, assetLabels.length) : ['#334155'];
            manager.assetPieChart.update('none');
        }

        // Update Liabilities Pie Chart
        if (manager.liabilityPieChart) {
            const liabilityLabels = Object.keys(liabilityTotalsByCategory);
            const liabilityData = Object.values(liabilityTotalsByCategory);
            manager.liabilityPieChart.data.labels = liabilityLabels.length > 0 ? liabilityLabels : ['No Liabilities'];
            manager.liabilityPieChart.data.datasets[0].data = liabilityData.length > 0 ? liabilityData : [1];
            manager.liabilityPieChart.data.datasets[0].backgroundColor = liabilityLabels.length > 0 ? liabilityColors.slice(0, liabilityLabels.length) : ['#334155'];
            manager.liabilityPieChart.update('none');
        }
    }

    static initHistoryChart(manager) {
        const canvas = document.getElementById('nwHistoryChart');
        if (!canvas || typeof Chart === 'undefined') return;
        const ctx = canvas.getContext('2d');

        if (manager.historyChart) {
            manager.historyChart.destroy();
        }

        manager.historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Net Worth',
                    data: [],
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#06b6d4'
                }]
            },
            options: {
                animation: false,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    datalabels: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const symbol = manager.currency === 'THB' ? '฿' : '$';
                                return `Net Worth: ${symbol}${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.03)' },
                        ticks: { color: '#64748b', font: { family: 'Rajdhani', size: 10 } }
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: {
                            color: '#64748b',
                            font: { family: 'Rajdhani', size: 10 },
                            callback: (val) => {
                                const symbol = manager.currency === 'THB' ? '฿' : '$';
                                return `${symbol}${val.toLocaleString('en-US', { notation: 'compact' })}`;
                            }
                        }
                    }
                }
            }
        });
    }

    static updateHistoryChart(manager, historyData) {
        if (!manager.historyChart) {
            this.initHistoryChart(manager);
        }
        if (!manager.historyChart) return;

        const labels = historyData.map(h => h.weekLabel || h.week);
        const values = historyData.map(h => h.netWorth);

        manager.historyChart.data.labels = labels;
        manager.historyChart.data.datasets[0].data = values;
        manager.historyChart.update('none');
    }
}
