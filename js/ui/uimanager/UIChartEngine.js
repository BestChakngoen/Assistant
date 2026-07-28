export class UIChartEngine {
    static initChart(uiManager) {
        const canvas = document.getElementById('pnlChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (typeof Chart !== 'undefined') {
            Chart.defaults.font.family = 'Rajdhani';
            Chart.defaults.color = '#64748b';
            if (typeof ChartDataLabels !== 'undefined') {
                Chart.register(ChartDataLabels);
            }
            uiManager.chart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Net P&L',
                            data: [],
                            backgroundColor: c => c.raw >= 0 ? '#22c55e' : '#ef4444',
                            borderRadius: 4,
                            yAxisID: 'pnl',
                            order: 1,
                            barPercentage: 0.7,
                            datalabels: {
                                color: function (context) {
                                    const value = context.dataset.data[context.dataIndex];
                                    if (value < 0) return '#ff0000';
                                    return '#22c55e';
                                }
                            }
                        },
                        {
                            label: 'Orders',
                            data: [],
                            backgroundColor: '#f59e0b',
                            borderColor: '#fbbf24',
                            borderWidth: 0,
                            borderRadius: 2,
                            yAxisID: 'trades',
                            order: 2,
                            barPercentage: 0.7,
                            datalabels: {
                                color: '#f59e0b'
                            }
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 40,
                            right: 10,
                            bottom: 10,
                            left: 10
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        datalabels: {
                            anchor: 'end',
                            align: 'top',
                            textAlign: 'center',
                            font: { size: 12, weight: 'bold', family: 'Rajdhani' },
                            formatter: function (value, context) {
                                if (value === 0 || value === null) return '';
                                if (context.dataset.label.includes('Orders')) {
                                    return value + '';
                                }
                                
                                let amountLabel = value.toFixed(2);
                                const percentages = context.dataset.customPercentages;
                                if (percentages && percentages[context.dataIndex] !== undefined) {
                                    const pct = percentages[context.dataIndex];
                                    if (Math.abs(pct) > 0.001) {
                                        return `(${pct > 0 ? '+' : ''}${pct.toFixed(1)}%)\n${amountLabel}`;
                                    }
                                }
                                return amountLabel;
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.dataset.label || '';
                                    const value = context.parsed.y;
                                    if (label.includes('Orders')) {
                                        return label + ': ' + value + ' orders';
                                    }
                                    let tooltipLabel = label + ': ' + value.toFixed(2);
                                    const percentages = context.dataset.customPercentages;
                                    if (percentages && percentages[context.dataIndex] !== undefined) {
                                        const pct = percentages[context.dataIndex];
                                        tooltipLabel += ` (${pct > 0 ? '+' : ''}${pct.toFixed(2)}%)`;
                                    }
                                    return tooltipLabel;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            offset: true,
                            categoryPercentage: 1.0
                        },
                        pnl: {
                            position: 'left',
                            grid: { color: 'rgba(255,255,255,0.05)' },
                            title: { display: true, text: 'P&L (USD)' }
                        },
                        trades: {
                            position: 'right',
                            grid: { display: false },
                            ticks: { color: '#f59e0b', stepSize: 1, beginAtZero: true, font: { size: 11, weight: 'bold' } },
                            beginAtZero: true,
                            title: { display: true, text: 'Orders' }
                        }
                    }
                }
            });
        }
    }

    static initTradesChart(uiManager) {
        return;
    }

    static initChartControls(uiManager) {
        if (uiManager.dom.chartControls.next && uiManager.dom.chartControls.next.parentNode) {
            const btnContainer = uiManager.dom.chartControls.next.parentNode;
            
            uiManager.periodStatsEl = document.createElement('div');
            uiManager.periodStatsEl.className = 'ml-3 text-xs font-mono font-bold flex items-center gap-2 px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50';
            uiManager.periodStatsEl.innerHTML = '<span class="text-slate-500">PERIOD:</span> <span class="text-slate-300">...</span>';
            
            btnContainer.parentNode.insertBefore(uiManager.periodStatsEl, btnContainer.nextSibling);
            if (!uiManager.periodStatsEl.parentNode) btnContainer.parentNode.appendChild(uiManager.periodStatsEl);
        }

        if (uiManager.dom.chartControls.prev) {
            uiManager.dom.chartControls.prev.onclick = () => this.shiftChart(uiManager, 1);
        }
        if (uiManager.dom.chartControls.next) {
            uiManager.dom.chartControls.next.onclick = () => this.shiftChart(uiManager, -1);
        }
    }

    static shiftChart(uiManager, delta) {
        if (!uiManager.chartState.data) return;
        
        const totalLen = uiManager.chartState.data.labels.length;
        const totalPages = Math.ceil(totalLen / uiManager.chartState.limit);
        
        let newPageIndex = uiManager.chartState.pageIndex + delta;

        if (newPageIndex < 0) newPageIndex = 0;
        if (newPageIndex >= totalPages) newPageIndex = totalPages - 1;

        if (newPageIndex !== uiManager.chartState.pageIndex) {
            uiManager.chartState.pageIndex = newPageIndex;
            this.renderChart(uiManager);
        }
    }

    static renderChart(uiManager) {
        if (!uiManager.chart || !uiManager.chartState.data) return;

        const { labels, pnl, trades, percentages, balances } = uiManager.chartState.data;
        const totalLen = labels.length;
        const limit = uiManager.chartState.limit;
        const totalPages = Math.ceil(totalLen / limit);
        
        const chunkIndex = totalPages - 1 - uiManager.chartState.pageIndex;
        
        let start = chunkIndex * limit;
        let end = Math.min(totalLen, start + limit);

        if (start < 0) start = 0;
        if (end < start) end = start;
        
        const slicedLabels = labels.slice(start, end);
        const slicedPnl = pnl.slice(start, end);
        const slicedTrades = trades.slice(start, end);
        const slicedPercentages = percentages.slice(start, end);
        const slicedBalances = balances ? balances.slice(start, end) : [];

        if (uiManager.periodStatsEl && slicedPnl.length > 0) {
            const totalSlicePnL = slicedPnl.reduce((a, b) => a + b, 0);
            const startBalance = slicedBalances.length > 0 ? slicedBalances[0] : 0;
            
            let periodRoi = 0;
            if (Math.abs(startBalance) > 0.01) {
                periodRoi = (totalSlicePnL / startBalance) * 100;
            }

            const colorClass = totalSlicePnL >= 0 ? 'text-green-400' : 'text-red-400';
            const sign = totalSlicePnL >= 0 ? '+' : '';
            
            uiManager.periodStatsEl.innerHTML = `<span class="text-slate-500 hidden md:inline">SUMMARY:</span> <span class="${colorClass}">${sign}${periodRoi.toFixed(2)}% (${sign}${totalSlicePnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>`;
        } else if (uiManager.periodStatsEl) {
            uiManager.periodStatsEl.innerHTML = '<span class="text-slate-500">NO DATA</span>';
        }

        uiManager.chart.data.labels = slicedLabels;
        uiManager.chart.data.datasets[0].data = slicedPnl;
        uiManager.chart.data.datasets[0].customPercentages = slicedPercentages;
        uiManager.chart.data.datasets[1].data = slicedTrades;
        uiManager.chart.update();

        const isLatestPage = (uiManager.chartState.pageIndex <= 0);
        const isOldestPage = (uiManager.chartState.pageIndex >= totalPages - 1);
        
        if (uiManager.dom.chartControls.next) {
            uiManager.dom.chartControls.next.disabled = isLatestPage;
            uiManager.dom.chartControls.next.style.opacity = isLatestPage ? '0.3' : '1';
        }
        
        if (uiManager.dom.chartControls.prev) {
            uiManager.dom.chartControls.prev.disabled = isOldestPage;
            uiManager.dom.chartControls.prev.style.opacity = isOldestPage ? '0.3' : '1';
        }
    }
}
