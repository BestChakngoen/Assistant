import { NetWorthChartEngine } from './NetWorthChartEngine.js';

/**
 * NetWorthManager.js - Net Worth Data & State Manager (100% English)
 * Solid OOP & Clean Architecture for Asset and Liability Tracking.
 */
export class NetWorthManager {
    constructor() {
        this.items = [];
        this.snapshots = {}; // Format: { "YYYY-Www": { netWorth: number, totalAssets: number, totalLiabilities: number, lastUpdated: ISOString } }
        this.filter = 'ALL';
        this.currency = localStorage.getItem('tradetracker_networth_currency') || 'THB';
        this.exchangeRate = 35.5; // Default fallback USD to THB rate
        this.storageKey = 'tradetracker_networth_items_v1';
        this.snapshotStorageKey = 'tradetracker_networth_snapshots_v1';
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

    getISOWeekKey(dateInput = new Date()) {
        const date = new Date(dateInput);
        date.setHours(0, 0, 0, 0);
        // Thursday in current week decides the year
        date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
        const week1 = new Date(date.getFullYear(), 0, 4);
        // Adjust to Thursday in week 1 and count number of weeks
        const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        const formattedWeek = weekNumber.toString().padStart(2, '0');
        return `${date.getFullYear()}-W${formattedWeek}`;
    }

    async initSupabaseSync() {
        if (typeof window === 'undefined') return;

        const getSupabase = () => {
            if (window.shareManager?.supabase) return window.shareManager.supabase;
            if (!window.supabaseClient && window.supabase) {
                window.supabaseClient = window.supabase.createClient('https://ujjwaxdwemrdszyatgxw.supabase.co', 'sb_publishable_Zov-pzfGxNS9yUAGwfhMEg_9PxBeYG3');
            }
            return window.supabaseClient || null;
        };
        const supabase = getSupabase();

        if (!supabase) {
            this.updateCloudStatus(false);
            return;
        }

        try {
            const uid = window.app?.auth?.currentUser?.uid || 'default_user';
            this.updateCloudStatus(true);

            // Fetch initial NetWorth data from Supabase net_worth table
            const { data, error } = await supabase
                .from('net_worth')
                .select('*')
                .eq('user_id', uid)
                .maybeSingle();

            if (!error && data) {
                if (Array.isArray(data.items)) this.items = data.items;
                if (data.snapshots && typeof data.snapshots === 'object') this.snapshots = data.snapshots;
                localStorage.setItem(this.storageKey, JSON.stringify(this.items));
                localStorage.setItem(this.snapshotStorageKey, JSON.stringify(this.snapshots));
                this.render();
            }

            // Realtime Subscription (Remove existing channel if subscribed)
            if (this.netWorthChannel) {
                try { supabase.removeChannel(this.netWorthChannel); } catch (e) {}
            }
            this.netWorthChannel = supabase
                .channel('networth_realtime_' + Date.now())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'net_worth' }, (payload) => {
                    if (payload.new && (payload.new.user_id === uid || !payload.new.user_id)) {
                        if (Array.isArray(payload.new.items)) this.items = payload.new.items;
                        if (payload.new.snapshots && typeof payload.new.snapshots === 'object') this.snapshots = payload.new.snapshots;
                        localStorage.setItem(this.storageKey, JSON.stringify(this.items));
                        localStorage.setItem(this.snapshotStorageKey, JSON.stringify(this.snapshots));
                        this.render();
                    }
                })
                .subscribe();
        } catch (err) {
            console.warn('Supabase NetWorth sync notice:', err);
            this.updateCloudStatus(false);
        }
    }

    updateCloudStatus(isConnected) {
        const statusEl = document.getElementById('nw-cloud-status');
        if (!statusEl) return;

        if (isConnected) {
            statusEl.className = 'text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/20 font-bold flex items-center gap-1.5';
            statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span><span>SUPABASE CONNECTED</span>`;
        } else {
            statusEl.className = 'text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 font-bold flex items-center gap-1.5';
            statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span><span>SUPABASE OFFLINE</span>`;
        }
    }

    async fetchExchangeRate() {
        try {
            const res = await fetch('https://open.er-api.com/v6/latest/USD');
            if (res.ok) {
                const data = await res.json();
                if (data && data.rates && data.rates.THB) {
                    this.exchangeRate = data.rates.THB;
                }
            }
        } catch (e) {
            console.warn('Could not fetch live exchange rate, using fallback 35.5:', e);
        }
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
                { id: '1', name: 'Main Savings Account', type: 'ASSET', category: 'Cash & Bank', amount: 15000, date: new Date().toISOString() },
                { id: '2', name: 'US Stock Portfolio', type: 'ASSET', category: 'Investments', amount: 24500, date: new Date().toISOString() },
                { id: '3', name: 'Credit Card Balance', type: 'LIABILITY', category: 'Credit & Debt', amount: 1200, date: new Date().toISOString() }
            ];

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

            if (typeof window !== 'undefined') {
                const getSupabase = () => {
                    if (window.shareManager?.supabase) return window.shareManager.supabase;
                    if (!window.supabaseClient && window.supabase) {
                        window.supabaseClient = window.supabase.createClient('https://ujjwaxdwemrdszyatgxw.supabase.co', 'sb_publishable_Zov-pzfGxNS9yUAGwfhMEg_9PxBeYG3');
                    }
                    return window.supabaseClient || null;
                };
                const supabase = getSupabase();
                if (supabase) {
                    const uid = window.app?.auth?.currentUser?.uid || 'default_user';
                    await supabase
                        .from('net_worth')
                        .upsert([{
                            user_id: uid,
                            items: this.items,
                            snapshots: this.snapshots,
                            updated_at: new Date().toISOString()
                        }], { onConflict: 'user_id' });
                }
            }
        } catch (e) {
            console.error('Failed to save Net Worth data to Supabase:', e);
        }
    }

    updateWeeklySnapshot() {
        const { totalAssets, totalLiabilities, netWorth } = this.calculateTotals();
        const currentWeekKey = this.getISOWeekKey(new Date());

        // Always overwrite current week snapshot with latest update
        this.snapshots[currentWeekKey] = {
            netWorth,
            totalAssets,
            totalLiabilities,
            lastUpdated: new Date().toISOString()
        };
    }

    addItem(name, type, category, amount) {
        if (!name || isNaN(amount) || amount <= 0) return false;
        
        const newItem = {
            id: Date.now().toString(),
            name,
            type,
            category,
            amount: parseFloat(amount),
            currency: this.currency,
            date: new Date().toISOString()
        };

        this.items.unshift(newItem);
        this.updateWeeklySnapshot();
        this.saveData();
        this.render();
        return true;
    }

    getItemConvertedAmount(item) {
        const itemCurr = item.currency || 'THB';
        const targetCurr = this.currency;
        const rate = this.exchangeRate > 0 ? this.exchangeRate : 35.5;

        if (itemCurr === targetCurr) {
            return item.amount;
        }

        if (itemCurr === 'THB' && targetCurr === 'USD') {
            return item.amount / rate;
        } else if (itemCurr === 'USD' && targetCurr === 'THB') {
            return item.amount * rate;
        }

        return item.amount;
    }

    editItem(id, newName, newCategory, newAmount) {
        const item = this.items.find(i => i.id === id);
        if (!item) return false;

        const parsedAmount = parseFloat(newAmount);
        if (!newName || isNaN(parsedAmount) || parsedAmount <= 0) return false;

        item.name = newName.trim();
        item.category = newCategory;
        item.amount = parsedAmount;
        item.currency = this.currency;

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
        if (typeof window !== 'undefined' && window.app && window.app.ui && window.app.ui.share) {
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
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    showAppleAlertModal(title, message, icon = 'alert-circle') {
        const existing = document.getElementById('nw-alert-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'nw-alert-modal';
        overlay.className = 'share-overlay';
        overlay.innerHTML = `
            <div class="share-modal-card">
                <div class="share-modal-body">
                    <div class="share-modal-icon-badge text-amber-400">
                        <i data-lucide="${icon}" class="w-8 h-8"></i>
                    </div>
                    <h3 class="share-modal-title">${title}</h3>
                    <p class="share-modal-message">${message}</p>
                    <div class="share-modal-divider"></div>
                    <div class="share-modal-actions">
                        <button id="btn-nw-alert-ok" class="share-modal-btn share-modal-btn-confirm bg-cyan-600 hover:bg-cyan-500 text-white w-full py-2.5 rounded-xl font-bold font-mono text-xs cursor-pointer">
                            OK
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
            overlay.classList.remove('share-overlay-visible');
            const card = overlay.querySelector('.share-modal-card');
            if (card) card.classList.remove('share-modal-card-visible');
            setTimeout(() => overlay.remove(), 200);
        };

        const btnOk = overlay.querySelector('#btn-nw-alert-ok');
        if (btnOk) btnOk.onclick = close;
        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };
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
                    this.showAppleAlertModal('Incomplete Information', 'Please enter an Item Name before adding to your portfolio.');
                    return;
                }
                if (isNaN(amount) || amount <= 0) {
                    this.showAppleAlertModal('Invalid Amount', 'Please enter a valid positive amount value.');
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

        // Render Charts
        NetWorthChartEngine.updateCategoryPieCharts(this);
        NetWorthChartEngine.updateHistoryChart(this, this.get52WeekHistory());
    }

    renderList() {
        const container = document.getElementById('nw-items-list');
        const countEl = document.getElementById('nw-items-count');
        if (!container) return;

        const filtered = this.items.filter(item => {
            if (this.filter === 'ALL') return true;
            return item.type === this.filter;
        });

        if (countEl) countEl.innerText = `${filtered.length} items registered`;

        if (filtered.length === 0) {
            container.innerHTML = `<div class="text-center text-slate-500 py-12 text-xs font-mono">No financial items recorded in this view.</div>`;
            return;
        }

        const symbol = this.currency === 'THB' ? '฿' : '$';
        container.innerHTML = '';
        filtered.forEach(item => {
            const isAsset = item.type === 'ASSET';
            const borderClass = isAsset ? 'bg-slate-900/40' : 'bg-slate-900/40';
            const textClass = isAsset ? 'text-emerald-400' : 'text-red-400';
            const typeLabel = isAsset ? 'ASSET' : 'LIABILITY';
            const convertedAmt = this.getItemConvertedAmount(item);

            const card = document.createElement('div');
            card.className = `p-3.5 rounded-xl ${borderClass} flex justify-between items-center group transition hover:bg-slate-800/60 nw-item-card`;
            
            const renderNormalState = () => {
                card.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg ${isAsset ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} flex items-center justify-center font-mono font-bold text-xs shrink-0">
                            ${isAsset ? '+' : '-'}
                        </div>
                        <div>
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="font-bold font-mono text-slate-200 text-xs">${item.name}</span>
                                <span class="text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">${item.category}</span>
                            </div>
                            <span class="text-[10px] font-mono font-bold ${textClass}">${typeLabel}</span>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="font-mono font-bold text-sm ${textClass}">${isAsset ? '+' : '-'}${symbol}${convertedAmt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <button class="edit-nw-btn text-slate-500 hover:text-cyan-400 transition p-1 text-xs" data-id="${item.id}" title="Edit Record">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                        </button>
                        <button class="delete-nw-btn text-slate-600 hover:text-red-400 transition p-1 text-xs" data-id="${item.id}" title="Delete Record">✕</button>
                    </div>
                `;

                const btnEdit = card.querySelector('.edit-nw-btn');
                if (btnEdit) {
                    btnEdit.onclick = (e) => {
                        e.stopPropagation();
                        renderEditState();
                    };
                }

                const btnDelete = card.querySelector('.delete-nw-btn');
                if (btnDelete) {
                    btnDelete.onclick = (e) => {
                        e.stopPropagation();
                        this.deleteItem(item.id);
                    };
                }

                if (window.lucide) window.lucide.createIcons();
            };

            const renderEditState = () => {
                const categories = ['Cash & Bank', 'Investments', 'Real Estate & Vehicle', 'Valuables & Crypto', 'Credit & Debt', 'Other'];
                const categoryOptions = categories.map(cat => `<option value="${cat}" ${item.category === cat ? 'selected' : ''}>${cat}</option>`).join('');

                card.innerHTML = `
                    <div class="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-1 font-mono">
                        <div class="flex flex-1 gap-2">
                            <input type="text" class="nw-edit-name bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs flex-1 focus:border-cyan-500 outline-none" value="${item.name}" placeholder="Item Name">
                            <select class="nw-edit-cat bg-slate-950 text-slate-300 border border-slate-700 rounded-lg px-2 py-1 text-[11px] focus:border-cyan-500 outline-none">
                                ${categoryOptions}
                            </select>
                        </div>
                        <div class="flex items-center gap-2">
                            <input type="number" step="0.01" min="0" class="nw-edit-amount w-28 bg-slate-950 text-emerald-400 font-bold border border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:border-cyan-500 outline-none" value="${item.amount}" placeholder="Amount">
                            <button class="nw-save-btn px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition">Save</button>
                            <button class="nw-cancel-btn px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg text-xs transition">Cancel</button>
                        </div>
                    </div>
                `;

                const btnSave = card.querySelector('.nw-save-btn');
                const btnCancel = card.querySelector('.nw-cancel-btn');
                const inputName = card.querySelector('.nw-edit-name');
                const inputCat = card.querySelector('.nw-edit-cat');
                const inputAmt = card.querySelector('.nw-edit-amount');

                btnCancel.onclick = (e) => {
                    e.stopPropagation();
                    renderNormalState();
                };

                btnSave.onclick = (e) => {
                    e.stopPropagation();
                    const newName = inputName.value.trim();
                    const newCat = inputCat.value;
                    const newAmt = inputAmt.value;
                    if (this.editItem(item.id, newName, newCat, newAmt)) {
                        renderNormalState();
                    }
                };
            };

            renderNormalState();
            container.appendChild(card);
        });
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

