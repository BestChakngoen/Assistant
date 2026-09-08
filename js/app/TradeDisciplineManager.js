/**
 * TradeDisciplineManager.js - Trading Discipline & Risk Guardian Subsystem
 * Enforces monthly trade quotas (20 trades/month), daily profit targets (+10%),
 * and daily loss circuit breakers (-5%) with Smart Warning Mode.
 */
import { ShareUI } from '../ui/share/ShareUI.js';

export class TradeDisciplineManager {
    constructor(app) {
        this.app = app;
        this.storageKey = 'tradetracker_discipline_limits_v1';
        this.limits = this.loadLimits();
        this.initEventListeners();
    }

    loadLimits() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                return {
                    maxMonthlyTrades: parseInt(parsed.maxMonthlyTrades, 10) || 20,
                    maxDailyProfitPct: parseFloat(parsed.maxDailyProfitPct) || 10,
                    maxDailyLossPct: parseFloat(parsed.maxDailyLossPct) || 5
                };
            }
        } catch (e) {}
        return {
            maxMonthlyTrades: 20,
            maxDailyProfitPct: 10,
            maxDailyLossPct: 5
        };
    }

    saveLimits(newLimits) {
        this.limits = { ...this.limits, ...newLimits };
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.limits));
        } catch (e) {}
        this.updateUI(this.app.trades || []);
    }

    initEventListeners() {
        document.addEventListener('click', (e) => {
            const btnSettings = e.target.closest('#btn-discipline-settings');
            if (btnSettings) {
                ShareUI.playSound('mouse-click');
                this.showSettingsModal();
            }
        });

        const dateInput = document.getElementById('input-date');
        if (dateInput) {
            dateInput.addEventListener('change', () => {
                this.updateUI(this.app.trades || []);
            });
        }
    }

    getCurrentBalance() {
        const balEl = document.getElementById('summary-balance');
        if (balEl) {
            const parsed = parseFloat(balEl.innerText.replace(/,/g, ''));
            if (!isNaN(parsed)) return parsed;
        }
        return 0;
    }

    getMonthlyTrades(trades, targetDateStr) {
        const date = targetDateStr ? new Date(targetDateStr) : new Date();
        const yearMonth = targetDateStr 
            ? targetDateStr.substring(0, 7) 
            : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const monthlyTrades = (trades || []).filter(t => {
            if (!t.date || !t.date.startsWith(yearMonth)) return false;
            return t.type === 'WIN' || t.type === 'LOSS';
        });

        return {
            yearMonth,
            count: monthlyTrades.length,
            trades: monthlyTrades
        };
    }

    getDailyStats(trades, targetDateStr, balance) {
        const dateStr = targetDateStr || new Date().toISOString().substring(0, 10);
        const dailyTrades = (trades || []).filter(t => t.date === dateStr && (t.type === 'WIN' || t.type === 'LOSS'));

        let netDailyPnL = 0;
        let dailyWins = 0;
        let dailyLosses = 0;

        dailyTrades.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            netDailyPnL += amt;
            if (amt > 0) dailyWins++;
            else if (amt < 0) dailyLosses++;
        });

        const currentBal = balance !== undefined ? balance : this.getCurrentBalance();
        const startOfDayBal = Math.max(1, currentBal - netDailyPnL);
        const pnlPercent = (netDailyPnL / startOfDayBal) * 100;

        const maxDailyLossAmount = (startOfDayBal * (this.limits.maxDailyLossPct / 100));
        const maxDailyProfitAmount = (startOfDayBal * (this.limits.maxDailyProfitPct / 100));

        return {
            dateStr,
            count: dailyTrades.length,
            netDailyPnL,
            pnlPercent,
            startOfDayBal,
            maxDailyLossAmount,
            maxDailyProfitAmount,
            isLossBreached: pnlPercent <= -this.limits.maxDailyLossPct,
            isProfitReached: pnlPercent >= this.limits.maxDailyProfitPct
        };
    }

    checkTradeAllowed(newTrade, trades) {
        const targetDate = newTrade.date || new Date().toISOString().substring(0, 10);
        const isTradeItem = (newTrade.type === 'WIN' || newTrade.type === 'LOSS');

        if (!isTradeItem) {
            return { violates: false };
        }

        // 1. Check Monthly Quota (20 trades/month)
        const monthly = this.getMonthlyTrades(trades, targetDate);
        if (monthly.count >= this.limits.maxMonthlyTrades) {
            return {
                violates: true,
                type: 'MONTHLY_QUOTA',
                title: 'Monthly Trade Limit Reached',
                badge: `${monthly.count} / ${this.limits.maxMonthlyTrades} Trades`,
                badgeColor: 'text-rose-400 bg-rose-500/15',
                icon: 'alert-triangle',
                message: `You have already recorded <strong>${monthly.count} trades</strong> in ${monthly.yearMonth}, reaching your monthly quota of <strong>${this.limits.maxMonthlyTrades} trades</strong>.<br><br>Overtrading is a primary cause of fatigue and capital drawdown. Professional discipline suggests reviewing your journal and waiting for the next calendar month.`
            };
        }

        // 2. Check Daily P&L Limits
        const daily = this.getDailyStats(trades, targetDate);
        const newTradeAmt = parseFloat(newTrade.amount) || 0;
        const projectedDailyPnL = daily.netDailyPnL + newTradeAmt;
        const projectedPnlPct = (projectedDailyPnL / daily.startOfDayBal) * 100;

        // Daily Loss Limit (-5%)
        if (projectedPnlPct <= -this.limits.maxDailyLossPct) {
            return {
                violates: true,
                type: 'DAILY_LOSS_LIMIT',
                title: 'Daily Loss Limit Breached',
                badge: `${projectedPnlPct.toFixed(1)}% Loss (Limit: -${this.limits.maxDailyLossPct}%)`,
                badgeColor: 'text-rose-400 bg-rose-500/15',
                icon: 'shield-alert',
                message: `This transaction will bring your daily loss to <strong>${projectedPnlPct.toFixed(2)}%</strong> (-$${Math.abs(projectedDailyPnL).toFixed(2)}), exceeding your daily limit of <strong>-${this.limits.maxDailyLossPct}%</strong>.<br><br>🚨 <strong>Circuit Breaker Activated:</strong> Protecting your equity from revenge trading is crucial. Stop trading for the rest of today.`
            };
        }

        // Daily Profit Target (+10%)
        if (projectedPnlPct >= this.limits.maxDailyProfitPct) {
            return {
                violates: true,
                type: 'DAILY_PROFIT_TARGET',
                title: 'Daily Profit Target Achieved!',
                badge: `+${projectedPnlPct.toFixed(1)}% Gain (Target: +${this.limits.maxDailyProfitPct}%)`,
                badgeColor: 'text-emerald-400 bg-emerald-500/15',
                icon: 'trophy',
                message: `Congratulations! This transaction brings your daily profit to <strong>+${projectedPnlPct.toFixed(2)}%</strong> (+$${projectedDailyPnL.toFixed(2)}), hitting your target of <strong>+${this.limits.maxDailyProfitPct}%</strong>.<br><br>🎯 <strong>Lock In Your Gains:</strong> Many profitable days are given back to the market by overtrading. Consider stopping for today to protect your winning day.`
            };
        }

        return { violates: false };
    }

    updateUI(trades) {
        const dateInput = document.getElementById('input-date');
        const selectedDate = dateInput ? dateInput.value : '';

        // 1. Update Monthly Widget
        const monthly = this.getMonthlyTrades(trades, selectedDate);
        const monthlyCountEl = document.getElementById('guardian-monthly-count');
        const monthlyBarEl = document.getElementById('guardian-monthly-bar');
        const monthlyMonthEl = document.getElementById('guardian-monthly-month');
        const monthlyRemainingEl = document.getElementById('guardian-monthly-remaining');

        const maxM = this.limits.maxMonthlyTrades;
        const pctM = Math.min(100, Math.round((monthly.count / maxM) * 100));
        const remaining = Math.max(0, maxM - monthly.count);

        if (monthlyCountEl) monthlyCountEl.innerText = `${monthly.count} / ${maxM}`;
        if (monthlyMonthEl) {
            const [y, m] = monthly.yearMonth.split('-');
            const monthName = new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('en-US', { month: 'short', year: 'numeric' });
            monthlyMonthEl.innerText = monthName;
        }
        if (monthlyRemainingEl) {
            monthlyRemainingEl.innerText = remaining > 0 ? `Remaining: ${remaining} trades` : 'Quota Reached (0 left)';
            monthlyRemainingEl.className = remaining === 0 ? 'text-rose-400 font-bold' : 'text-slate-500';
        }
        if (monthlyBarEl) {
            monthlyBarEl.style.width = `${pctM}%`;
            if (pctM >= 100) {
                monthlyBarEl.className = 'bg-rose-500 h-full rounded-full transition-all duration-300 animate-pulse';
            } else if (pctM >= 80) {
                monthlyBarEl.className = 'bg-amber-500 h-full rounded-full transition-all duration-300';
            } else {
                monthlyBarEl.className = 'bg-cyan-500 h-full rounded-full transition-all duration-300';
            }
        }

        // 2. Update Daily Widget
        const daily = this.getDailyStats(trades, selectedDate);
        const dailyPnlEl = document.getElementById('guardian-daily-pnl');
        const dailyLossBarEl = document.getElementById('guardian-loss-bar');
        const dailyProfitBarEl = document.getElementById('guardian-profit-bar');
        const dailyStatusBadgeEl = document.getElementById('guardian-daily-status-badge');
        const dailyLossTargetEl = document.getElementById('guardian-daily-loss-target');
        const dailyProfitTargetEl = document.getElementById('guardian-daily-profit-target');

        if (dailyLossTargetEl) dailyLossTargetEl.innerText = `Max Loss: -${this.limits.maxDailyLossPct}%`;
        if (dailyProfitTargetEl) dailyProfitTargetEl.innerText = `Target: +${this.limits.maxDailyProfitPct}%`;

        if (dailyPnlEl) {
            const sign = daily.netDailyPnL >= 0 ? '+' : '-';
            const colorClass = daily.netDailyPnL > 0 ? 'text-emerald-400' : (daily.netDailyPnL < 0 ? 'text-rose-400' : 'text-slate-300');
            dailyPnlEl.className = `font-bold ${colorClass}`;
            dailyPnlEl.innerText = `${sign}$${Math.abs(daily.netDailyPnL).toFixed(2)} (${sign}${Math.abs(daily.pnlPercent).toFixed(1)}%)`;
        }

        // Update barometer bars
        if (dailyLossBarEl && dailyProfitBarEl) {
            if (daily.pnlPercent < 0) {
                const lossPct = Math.min(100, (Math.abs(daily.pnlPercent) / this.limits.maxDailyLossPct) * 100);
                dailyLossBarEl.style.width = `${lossPct}%`;
                dailyProfitBarEl.style.width = '0%';
            } else if (daily.pnlPercent > 0) {
                const profitPct = Math.min(100, (daily.pnlPercent / this.limits.maxDailyProfitPct) * 100);
                dailyProfitBarEl.style.width = `${profitPct}%`;
                dailyLossBarEl.style.width = '0%';
            } else {
                dailyLossBarEl.style.width = '0%';
                dailyProfitBarEl.style.width = '0%';
            }
        }

        if (dailyStatusBadgeEl) {
            if (daily.isLossBreached) {
                dailyStatusBadgeEl.className = 'text-xs font-mono font-bold px-2.5 py-0.5 rounded-full text-rose-400 bg-rose-500/15 animate-pulse';
                dailyStatusBadgeEl.innerText = '🔴 Loss Breached';
            } else if (daily.isProfitReached) {
                dailyStatusBadgeEl.className = 'text-xs font-mono font-bold px-2.5 py-0.5 rounded-full text-emerald-400 bg-emerald-500/15';
                dailyStatusBadgeEl.innerText = '🎯 Target Reached';
            } else if (daily.pnlPercent < 0 && Math.abs(daily.pnlPercent) >= this.limits.maxDailyLossPct * 0.7) {
                dailyStatusBadgeEl.className = 'text-xs font-mono font-bold px-2.5 py-0.5 rounded-full text-amber-400 bg-amber-500/15';
                dailyStatusBadgeEl.innerText = '⚠️ Near Loss Limit';
            } else {
                dailyStatusBadgeEl.className = 'text-xs font-mono font-bold px-2.5 py-0.5 rounded-full text-cyan-400 bg-cyan-500/10';
                dailyStatusBadgeEl.innerText = '🟢 Safe (Active)';
            }
        }
    }

    showSettingsModal() {
        const existing = document.getElementById('guardian-settings-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'guardian-settings-modal';
        overlay.className = 'share-overlay';
        overlay.innerHTML = `
            <div class="share-modal-card max-w-md w-full border-0" style="max-width: 420px;">
                <div class="p-6 flex flex-col gap-4 text-left">
                    <div class="flex justify-between items-center pb-3">
                        <div class="flex items-center gap-2">
                            <i data-lucide="sliders" class="w-5 h-5 text-cyan-400"></i>
                            <h3 class="text-sm font-mono font-bold text-white uppercase tracking-wider">Trading Discipline Limits</h3>
                        </div>
                        <button id="btn-close-guardian-settings" class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>

                    <div class="flex flex-col gap-3 font-mono text-xs">
                        <div class="bg-slate-950/40 p-3 rounded-xl">
                            <label class="block text-slate-400 font-bold mb-1">MONTHLY TRADES QUOTA</label>
                            <input type="number" id="input-limit-monthly" value="${this.limits.maxMonthlyTrades}" min="1" max="500" class="w-full bg-slate-900 text-cyan-400 font-bold rounded-xl px-3 py-2 outline-none">
                            <p class="text-[10px] text-slate-500 mt-1">Maximum allowed WIN/LOSS trades per calendar month (Default: 20).</p>
                        </div>

                        <div class="bg-slate-950/40 p-3 rounded-xl">
                            <label class="block text-slate-400 font-bold mb-1">DAILY PROFIT TARGET (%)</label>
                            <input type="number" id="input-limit-profit" value="${this.limits.maxDailyProfitPct}" step="0.5" min="1" max="100" class="w-full bg-slate-900 text-emerald-400 font-bold rounded-xl px-3 py-2 outline-none">
                            <p class="text-[10px] text-slate-500 mt-1">Target profit % of portfolio per day to lock in gains (Default: 10%).</p>
                        </div>

                        <div class="bg-slate-950/40 p-3 rounded-xl">
                            <label class="block text-slate-400 font-bold mb-1">DAILY MAX LOSS LIMIT (%)</label>
                            <input type="number" id="input-limit-loss" value="${this.limits.maxDailyLossPct}" step="0.5" min="0.5" max="50" class="w-full bg-slate-900 text-rose-400 font-bold rounded-xl px-3 py-2 outline-none">
                            <p class="text-[10px] text-slate-500 mt-1">Maximum daily drawdown allowed before circuit breaker (Default: 5%).</p>
                        </div>
                    </div>

                    <div class="flex gap-2.5 mt-2">
                        <button id="btn-save-guardian-settings" class="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs transition cursor-pointer">
                            Save Limits
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        requestAnimationFrame(() => {
            overlay.classList.add('share-overlay-visible');
            const card = overlay.querySelector('.share-modal-card');
            if (card) card.classList.add('share-modal-card-visible');
        });

        const close = () => {
            ShareUI.playSound('mouse-click');
            overlay.classList.remove('share-overlay-visible');
            const card = overlay.querySelector('.share-modal-card');
            if (card) card.classList.remove('share-modal-card-visible');
            setTimeout(() => overlay.remove(), 200);
        };

        const btnClose = overlay.querySelector('#btn-close-guardian-settings');
        if (btnClose) btnClose.onclick = close;

        const btnSave = overlay.querySelector('#btn-save-guardian-settings');
        if (btnSave) {
            btnSave.onclick = () => {
                const maxM = parseInt(overlay.querySelector('#input-limit-monthly').value, 10);
                const maxP = parseFloat(overlay.querySelector('#input-limit-profit').value);
                const maxL = parseFloat(overlay.querySelector('#input-limit-loss').value);

                if (!isNaN(maxM) && maxM > 0 && !isNaN(maxP) && maxP > 0 && !isNaN(maxL) && maxL > 0) {
                    this.saveLimits({
                        maxMonthlyTrades: maxM,
                        maxDailyProfitPct: maxP,
                        maxDailyLossPct: maxL
                    });
                    ShareUI.playSound('success');
                    close();
                }
            };
        }

        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };
    }

    showViolationWarningModal(violation) {
        return new Promise((resolve) => {
            ShareUI.playSound('mouse-click');
            const existing = document.getElementById('guardian-warning-modal');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'guardian-warning-modal';
            overlay.className = 'share-overlay';
            overlay.innerHTML = `
                <div class="share-modal-card max-w-md w-full border-0" style="max-width: 440px;">
                    <div class="share-modal-body text-center p-6">
                        <h3 class="share-modal-title text-lg font-bold">${violation.title}</h3>
                        <div class="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold ${violation.badgeColor} mt-2 mb-3">
                            ${violation.badge}
                        </div>
                        <div class="text-xs text-slate-300 font-mono leading-relaxed px-2 text-left bg-slate-950/60 p-3.5 rounded-xl mb-4">
                            ${violation.message}
                        </div>
                        <div class="share-modal-actions flex flex-col gap-2 w-full">
                            <button id="btn-guardian-cancel" class="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20">
                                I Understand, Cancel
                            </button>
                            <button id="btn-guardian-override" class="w-full py-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-400 hover:text-slate-200 font-mono text-[11px] transition cursor-pointer">
                                Confirm Record Anyway
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            if (window.lucide) window.lucide.createIcons();

            requestAnimationFrame(() => {
                overlay.classList.add('share-overlay-visible');
                const card = overlay.querySelector('.share-modal-card');
                if (card) card.classList.add('share-modal-card-visible');
            });

            const close = (result) => {
                ShareUI.playSound('mouse-click');
                overlay.classList.remove('share-overlay-visible');
                const card = overlay.querySelector('.share-modal-card');
                if (card) card.classList.remove('share-modal-card-visible');
                setTimeout(() => {
                    overlay.remove();
                    resolve(result);
                }, 200);
            };

            const btnCancel = overlay.querySelector('#btn-guardian-cancel');
            const btnOverride = overlay.querySelector('#btn-guardian-override');

            if (btnCancel) btnCancel.onclick = () => close(false);
            if (btnOverride) btnOverride.onclick = () => close(true);

            overlay.onclick = (e) => {
                if (e.target === overlay) close(false);
            };
        });
    }
}
