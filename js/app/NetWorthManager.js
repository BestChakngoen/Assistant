import { NetWorthChartEngine } from './NetWorthChartEngine.js';
import { NetWorthSyncService } from './networth/NetWorthSyncService.js';
import { NetWorthCardRenderer } from './networth/NetWorthCardRenderer.js';

/**
 * NetWorthManager.js - Net Worth Data & State Coordinator
 * Solid OOP & Clean Architecture (Refactored from God Class).
 */
export class NetWorthManager {
    constructor() {
        this.items = [];
        this.snapshots = {};
        this.filter = 'ALL';
        this.currency = localStorage.getItem('tradetracker_networth_currency') || 'THB';
        this.exchangeRate = 35.5;
        this.storageKey = 'tradetracker_networth_items_v1';
        this.snapshotStorageKey = 'tradetracker_networth_snapshots_v1';
        this.draggedIndex = null;
        this.pieChart = null;
        this.historyChart = null;
        this.init();
    }

    async init() {
        this.loadData();
        this.bindEvents();
        await this.fetchExchangeRate();
        await this.initSupabaseSync();
        this.render();
    }

    async initSupabaseSync() {
        return NetWorthSyncService.initSupabaseSync(this);
    }

    async fetchExchangeRate() {
        this.exchangeRate = await NetWorthSyncService.fetchExchangeRate();
        return this.exchangeRate;
    }

    updateCloudStatus(isConnected) {
        return NetWorthSyncService.updateCloudStatus(isConnected);
    }

    playClickSound() {
        NetWorthCardRenderer.playClickSound();
    }

    playRemoveSound() {
        NetWorthCardRenderer.playRemoveSound();
    }

    showAppleAlertModal(title, message, icon) {
        return NetWorthCardRenderer.showAppleAlertModal(title, message, icon);
    }

    showDeleteConfirmModal(item) {
        return NetWorthCardRenderer.showDeleteConfirmModal(this, item);
    }

    getISOWeekKey(dateInput = new Date()) {
        const date = new Date(dateInput);
        date.setHours(0, 0, 0, 0);
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        const formattedWeek = weekNumber.toString().padStart(2, '0');
        return `${date.getFullYear()}-W${formattedWeek}`;
    }

    setCurrency(currency) {
        this.currency = currency;
        try {
            localStorage.setItem('tradetracker_networth_currency', currency);
        } catch (e) {}
        this.updateToggleUI();
        this.render();
    }

    toggleCurrency() {
        const next = this.currency === 'THB' ? 'USD' : 'THB';
        this.setCurrency(next);
    }

    updateToggleUI() {
        const elThb = document.getElementById('nw-curr-thb');
        const elUsd = document.getElementById('nw-curr-usd');
        const elLabel = document.getElementById('nw-label-amount');

        if (this.currency === 'THB') {
            if (elThb) elThb.className = 'text-cyan-400 font-extrabold';
            if (elUsd) elUsd.className = 'text-slate-400';
            if (elLabel) elLabel.innerText = 'AMOUNT (THB)';
        } else {
            if (elThb) elThb.className = 'text-slate-400';
            if (elUsd) elUsd.className = 'text-cyan-400 font-extrabold';
            if (elLabel) elLabel.innerText = 'AMOUNT (USD)';
        }
    }

    loadData() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            this.items = raw ? JSON.parse(raw) : [
                { id: '1', name: 'Main Savings Account', type: 'ASSET', category: 'Cash & Bank', amount: 15000, currency: 'THB', date: new Date().toISOString() },
                { id: '2', name: 'US Stock Portfolio', type: 'ASSET', category: 'Investments', amount: 24500, currency: 'THB', date: new Date().toISOString() },
                { id: '3', name: 'Credit Card Balance', type: 'LIABILITY', category: 'Credit & Debt', amount: 1200, currency: 'THB', date: new Date().toISOString() }
            ];

            // Normalize legacy USD items to THB base
            if (Array.isArray(this.items)) {
                const rate = this.exchangeRate > 0 ? this.exchangeRate : 35.5;
                this.items.forEach(item => {
                    if (item.currency === 'USD') {
                        item.amount = item.amount * rate;
                        item.currency = 'THB';
                    }
                });
            }

            const rawSnap = localStorage.getItem(this.snapshotStorageKey);
            this.snapshots = rawSnap ? JSON.parse(rawSnap) : {};
        } catch (e) {
            this.items = [];
            this.snapshots = {};
        }
    }

    async saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
            localStorage.setItem(this.snapshotStorageKey, JSON.stringify(this.snapshots));
            await NetWorthSyncService.saveToSupabase(this);
        } catch (e) {
            console.error('Failed to save Net Worth data:', e);
        }
    }

    updateWeeklySnapshot() {
        const { totalAssets, totalLiabilities, netWorth } = this.calculateTotals();
        const currentWeekKey = this.getISOWeekKey(new Date());

        this.snapshots[currentWeekKey] = {
            netWorth,
            totalAssets,
            totalLiabilities,
            lastUpdated: new Date().toISOString()
        };
    }

    addItem(name, type, category, amount) {
        if (!name || isNaN(amount) || amount <= 0) return false;

        const rate = this.exchangeRate > 0 ? this.exchangeRate : 35.5;
        const numAmount = parseFloat(amount);
        const thbAmount = this.currency === 'USD' ? numAmount * rate : numAmount;

        const newItem = {
            id: Date.now().toString(),
            name,
            type,
            category,
            amount: thbAmount,
            currency: 'THB',
            date: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.items.unshift(newItem);
        this.updateWeeklySnapshot();
        this.saveData();
        this.render();
        return true;
    }

    getItemConvertedAmount(item) {
        const rate = this.exchangeRate > 0 ? this.exchangeRate : 35.5;
        let baseThb = item.amount || 0;

        if (item.currency === 'USD') {
            baseThb = baseThb * rate;
            item.currency = 'THB';
            item.amount = baseThb;
        }

        if (this.currency === 'USD') {
            return baseThb / rate;
        }
        return baseThb;
    }

    editItem(id, newName, newCategory, newAmount) {
        const item = this.items.find(i => i.id === id);
        if (!item) return false;

        const parsedAmount = parseFloat(newAmount);
        if (!newName || isNaN(parsedAmount) || parsedAmount <= 0) return false;

        const rate = this.exchangeRate > 0 ? this.exchangeRate : 35.5;
        const thbAmount = this.currency === 'USD' ? parsedAmount * rate : parsedAmount;

        item.name = newName.trim();
        item.category = newCategory;
        item.amount = thbAmount;
        item.currency = 'THB';
        item.updatedAt = new Date().toISOString();

        this.updateWeeklySnapshot();
        this.saveData();
        this.render();
        return true;
    }

    deleteItem(id) {
        this.items = this.items.filter(item => item.id !== id);
        this.updateWeeklySnapshot();
        this.saveData();
        this.render();
    }

    async clearAll() {
        if (typeof window !== 'undefined' && window.app?.ui?.share) {
            const confirmed = await window.app.ui.share.ShareUI.showConfirmModal({
                title: 'Clear Net Worth Records',
                message: 'Are you sure you want to clear all recorded financial items? This action cannot be undone.',
                confirmLabel: 'Clear All',
                confirmClass: 'bg-red-600 hover:bg-red-500 text-white'
            });
            if (confirmed) {
                this.items = [];
                this.updateWeeklySnapshot();
                this.saveData();
                this.render();
            }
        } else if (confirm('Are you sure you want to clear all Net Worth records?')) {
            this.items = [];
            this.updateWeeklySnapshot();
            this.saveData();
            this.render();
        }
    }

    setFilter(filter) {
        this.filter = filter;

        const btnAll = document.getElementById('nw-filter-all');
        const btnAsset = document.getElementById('nw-filter-asset');
        const btnLiability = document.getElementById('nw-filter-liability');

        const activeClasses = ['bg-cyan-500/20', 'text-cyan-400'];
        const inactiveClasses = ['bg-slate-800', 'text-slate-400'];

        [btnAll, btnAsset, btnLiability].forEach(btn => {
            if (!btn) return;
            btn.className = 'px-2.5 py-1 text-[10px] font-mono font-bold rounded-lg transition ';
            btn.classList.add(...inactiveClasses);
        });

        if (filter === 'ALL' && btnAll) {
            btnAll.classList.remove(...inactiveClasses);
            btnAll.classList.add(...activeClasses);
        } else if (filter === 'ASSET' && btnAsset) {
            btnAsset.classList.remove(...inactiveClasses);
            btnAsset.classList.add('bg-emerald-500/20', 'text-emerald-400');
        } else if (filter === 'LIABILITY' && btnLiability) {
            btnLiability.classList.remove(...inactiveClasses);
            btnLiability.classList.add('bg-red-500/20', 'text-red-400');
        }

        this.renderList();
        if (window.lucide) window.lucide.createIcons();
    }

    bindEvents() {
        const btnAdd = document.getElementById('nw-btn-add');
        if (btnAdd) {
            btnAdd.onclick = () => {
                const nameEl = document.getElementById('nw-input-name');
                const typeEl = document.getElementById('nw-input-type');
                const catEl = document.getElementById('nw-input-category');
                const amtEl = document.getElementById('nw-input-amount');

                if (!nameEl || !typeEl || !catEl || !amtEl) return;

                const name = nameEl.value.trim();
                const type = typeEl.value;
                const category = catEl.value;
                const amount = parseFloat(amtEl.value);

                if (!name) {
                    NetWorthCardRenderer.showAppleAlertModal('Incomplete Information', 'Please enter an Item Name before adding to your portfolio.');
                    return;
                }
                if (isNaN(amount) || amount <= 0) {
                    NetWorthCardRenderer.showAppleAlertModal('Invalid Amount', 'Please enter a valid positive amount value.');
                    return;
                }

                if (this.addItem(name, type, category, amount)) {
                    nameEl.value = '';
                    amtEl.value = '';
                }
            };
        }

        const btnAll = document.getElementById('nw-filter-all');
        if (btnAll) btnAll.onclick = () => this.setFilter('ALL');

        const btnAsset = document.getElementById('nw-filter-asset');
        if (btnAsset) btnAsset.onclick = () => this.setFilter('ASSET');

        const btnLiability = document.getElementById('nw-filter-liability');
        if (btnLiability) btnLiability.onclick = () => this.setFilter('LIABILITY');

        const btnClear = document.getElementById('nw-btn-clear-all');
        if (btnClear) btnClear.onclick = () => this.clearAll();

        const btnCurrency = document.getElementById('nw-currency-toggle');
        if (btnCurrency) btnCurrency.onclick = () => this.toggleCurrency();
    }

    calculateTotals() {
        let totalAssets = 0;
        let totalLiabilities = 0;

        this.items.forEach(item => {
            const convertedAmt = this.getItemConvertedAmount(item);
            if (item.type === 'ASSET') totalAssets += convertedAmt;
            else if (item.type === 'LIABILITY') totalLiabilities += convertedAmt;
        });

        const netWorth = totalAssets - totalLiabilities;
        return { totalAssets, totalLiabilities, netWorth };
    }

    get52WeekHistory() {
        const history = [];
        const now = new Date();

        for (let i = 51; i >= 0; i--) {
            const pastDate = new Date();
            pastDate.setDate(now.getDate() - (i * 7));
            const weekKey = this.getISOWeekKey(pastDate);

            let snap = this.snapshots[weekKey];
            let netWorth = snap ? snap.netWorth : 0;

            if (!snap && i === 0) {
                const totals = this.calculateTotals();
                netWorth = totals.netWorth;
            }

            const weekLabel = `W${weekKey.split('-W')[1] || (52 - i)}`;
            history.push({
                week: weekKey,
                weekLabel,
                netWorth
            });
        }
        return history;
    }

    checkWeeklyUpdateReminder() {
        const currentWeekKey = this.getISOWeekKey(new Date());
        const alertContainer = document.getElementById('nw-weekly-alert-container');
        if (!alertContainer) return;

        const currentSnap = this.snapshots[currentWeekKey];
        if (!currentSnap) {
            alertContainer.innerHTML = `
                <div class="glass-panel p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-amber-300 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <div class="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                            <i data-lucide="bell" class="w-5 h-5"></i>
                        </div>
                        <div>
                            <h4 class="text-xs font-mono font-bold uppercase tracking-wider">Weekly Net Worth Reminder</h4>
                            <p class="text-xs text-amber-200/80 mt-0.5 font-mono">You haven't updated your Net Worth portfolio for this week yet. Keep your 52-week history accurate!</p>
                        </div>
                    </div>
                </div>
            `;
        } else {
            alertContainer.innerHTML = '';
        }
    }

    renderSummary() {
        const { totalAssets, totalLiabilities, netWorth } = this.calculateTotals();

        const elAssets = document.getElementById('nw-total-assets');
        const elLiabilities = document.getElementById('nw-total-liabilities');
        const elNetWorth = document.getElementById('nw-net-worth');

        const symbol = this.currency === 'THB' ? '฿' : '$';
        const formatVal = (val) => `${symbol}${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

        if (elAssets) elAssets.innerText = formatVal(totalAssets);
        if (elLiabilities) elLiabilities.innerText = formatVal(totalLiabilities);
        if (elNetWorth) {
            elNetWorth.innerText = formatVal(netWorth);
            if (netWorth < 0) {
                elNetWorth.className = 'text-2xl sm:text-4xl font-mono font-bold text-red-400 mt-2';
            } else {
                elNetWorth.className = 'text-2xl sm:text-4xl font-mono font-bold text-cyan-400 mt-2';
            }
        }

        NetWorthChartEngine.updateCategoryPieCharts(this);
        NetWorthChartEngine.updateHistoryChart(this, this.get52WeekHistory());
    }

    renderList() {
        NetWorthCardRenderer.renderList(this);
    }

    render() {
        this.updateToggleUI();
        this.checkWeeklyUpdateReminder();
        this.renderSummary();
        this.renderList();
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }
}
