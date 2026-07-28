import { UIChartEngine } from './UIChartEngine.js';

export class UIStatsCalculator {
    static updatePriceDisplay(/*price*/) {
        return;
    }

    static updateTHB(uiManager, rate) {
        if (rate && uiManager.dom.displays && uiManager.dom.displays.thb) {
            uiManager.dom.displays.thb.style.color = '#4ade80';
            uiManager.dom.displays.thb.innerText = `${parseFloat(rate).toFixed(2)} ฿`;
            setTimeout(() => {
                if (uiManager.dom.displays.thb) uiManager.dom.displays.thb.style.color = 'white';
            }, 500);
        }
    }

    static updateStats(uiManager, trades) {
        try {
            let net = 0, dep = 0, wd = 0, wins = 0, losses = 0, best = -Infinity, worst = Infinity;
            const dailyPnL = {};
            const dailyFlow = {};
            const counts = {};

            for (let i = 0; i < trades.length; i++) {
                const t = trades[i];

                let dateStr = '1970-01-01';
                if (t.date) {
                    const dateType = typeof t.date;
                    if (dateType === 'string') {
                        const match = String(t.date).match(/^\d{4}-\d{2}-\d{2}/);
                        if (match) dateStr = match[0];
                    } else if (dateType === 'object' && typeof t.date.toISOString === 'function') {
                        dateStr = t.date.toISOString().split('T')[0];
                    }
                }

                const type = t.type || (t.amount >= 0 ? 'WIN' : 'LOSS');
                const amount = Number(t.amount) || 0;

                if (type === 'DEPOSIT') {
                    dep += amount;
                    dailyFlow[dateStr] = (dailyFlow[dateStr] || 0) + amount;
                } else if (type === 'WITHDRAW') {
                    wd += Math.abs(amount);
                    dailyFlow[dateStr] = (dailyFlow[dateStr] || 0) + amount;
                } else {
                    net += amount;
                    if (amount > 0) wins++; else losses++;
                    dailyPnL[dateStr] = (dailyPnL[dateStr] || 0) + amount;
                    counts[dateStr] = (counts[dateStr] || 0) + 1;
                }
            }

            for (const v of Object.values(dailyPnL)) {
                if (v > best) best = v;
                if (v < worst) worst = v;
            }
            if (best === -Infinity) best = 0;
            if (worst === Infinity || worst > 0) worst = 0;

            const fund = dep - wd;
            const roi = fund > 0 ? (net / fund) * 100 : 0;

            const summaryBalance = document.getElementById('summary-balance');
            if (summaryBalance) {
                summaryBalance.innerText = (fund + net).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            
            const balInput = document.getElementById('risk-balance');
            if (balInput) {
                balInput.dispatchEvent(new Event('input'));
            }

            const summaryFund = document.getElementById('summary-fund');
            if (summaryFund) {
                summaryFund.innerText = fund.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }

            const pEl = document.getElementById('summary-profit');
            if (pEl) {
                pEl.innerText = (net >= 0 ? '+' : '') + net.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                pEl.className = `text-2xl font-mono font-bold ${net >= 0 ? 'text-green-400' : 'text-red-400'}`;
            }

            const roiEl = document.getElementById('summary-roi');
            if (roiEl) {
                roiEl.innerText = `${roi.toFixed(1)}% ROI`;
                roiEl.className = `text-xs ${roi >= 0 ? 'text-green-400' : 'text-red-400'}`;
            }

            const summaryWinrate = document.getElementById('summary-winrate');
            if (summaryWinrate) {
                summaryWinrate.innerText = (wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(1) : 0) + '%';
            }

            const summaryWincount = document.getElementById('summary-wincount');
            if (summaryWincount) {
                summaryWincount.innerText = `${wins.toLocaleString('en-US')}W - ${losses.toLocaleString('en-US')}L`;
            }

            const expectancy = (wins + losses) > 0 ? (net / (wins + losses)) : 0;
            const expEl = document.getElementById('summary-expectancy');
            if (expEl) {
                expEl.innerText = (expectancy >= 0 ? '+' : '') + expectancy.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                expEl.className = `text-2xl font-mono font-bold ${expectancy >= 0 ? 'text-green-400' : 'text-red-400'}`;
            }

            const allDates = new Set([...Object.keys(dailyPnL), ...Object.keys(dailyFlow)]);
            const sortedDates = Array.from(allDates)
                .filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d))
                .sort((a, b) => new Date(a) - new Date(b));

            const sortedLabels = [];
            const sortedPnl = [];
            const sortedTrades = [];
            const sortedPercentages = [];
            const sortedBalances = [];

            let runningBalance = 0;

            sortedDates.forEach(date => {
                const dayPnL = dailyPnL[date] || 0;
                const dayFlow = dailyFlow[date] || 0;
                const dayCount = counts[date] || 0;

                const dailyBasis = runningBalance + dayFlow;
                
                let pct = 0;
                if (Math.abs(dailyBasis) > 0.01) {
                    pct = (dayPnL / dailyBasis) * 100;
                }

                runningBalance += dayFlow + dayPnL;

                if (dailyPnL[date] !== undefined) {
                    sortedLabels.push(date);
                    sortedPnl.push(dayPnL);
                    sortedTrades.push(dayCount);
                    sortedPercentages.push(pct);
                    sortedBalances.push(dailyBasis);
                }
            });

            uiManager.chartState.data = {
                labels: sortedLabels,
                pnl: sortedPnl,
                trades: sortedTrades,
                percentages: sortedPercentages,
                balances: sortedBalances
            };
            uiManager.chartState.pageIndex = 0;
            UIChartEngine.renderChart(uiManager);

            const totalTrades = wins + losses;
            const totalEl = document.getElementById('summary-totaltrades');
            if (totalEl) totalEl.innerText = totalTrades;
        } catch (e) {
            console.error('Error in updateStats:', e);
        }
    }

    static updateCloudStats(meta) {
        console.log('updateCloudStats called with meta:', meta);
        if (!meta) return;
        const totalEl = document.getElementById('summary-totaltrades');
        if (!totalEl) return;
        const val = (meta && meta.totalTrades != null) ? Number(meta.totalTrades) : NaN;
        if (isNaN(val)) return;
        const cur = Number(totalEl.innerText) || 0;
        if (val > cur) {
            totalEl.innerText = val;
            totalEl.style.color = '#38bdf8';
            setTimeout(() => totalEl.style.color = 'white', 500);
        }
    }
}
