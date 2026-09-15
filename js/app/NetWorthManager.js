import { NetWorthChartEngine } from './NetWorthChartEngine.js';
import { NetWorthSyncService } from './networth/NetWorthSyncService.js';
import { NetWorthCardRenderer } from './networth/NetWorthCardRenderer.js';
import { NetWorthVolatileAssetService } from './networth/NetWorthVolatileAssetService.js';
import { NetWorthPortfolioService } from './networth/NetWorthPortfolioService.js';

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
        this.activeVolatileMarketPrice = null;
        this.activeVolatileCurrency = 'USD';
        this.activeVolatileCategory = 'Stocks / ETFs';
        this._lastAutoRefresh = 0;
        window.netWorthManager = this;
        this.init();
    }

    async init() {
        this.loadData();
        this.bindEvents();
        await this.fetchExchangeRate();
        await this.initSupabaseSync();
        this.render();
        this.startExchangeRateLoop();
        this.autoRefreshOnLoad();
    }

    async initSupabaseSync() {
        return NetWorthSyncService.initSupabaseSync(this);
    }

    async fetchExchangeRate(forceRefresh = false) {
        const oldRate = this.exchangeRate;
        this.exchangeRate = await NetWorthSyncService.fetchExchangeRate(forceRefresh);
        this.updateRateDisplayUI();
        if (oldRate && this.exchangeRate && Math.abs(oldRate - this.exchangeRate) > 0.001) {
            this.renderSummary();
            this.renderList();
        }
        return this.exchangeRate;
    }

    updateRateDisplayUI() {
        const el = document.getElementById('nw-rate-display');
        if (el && this.exchangeRate > 0) {
            el.innerText = `1$ ≈ ฿${this.exchangeRate.toFixed(2)}`;
        }
    }

    startExchangeRateLoop() {
        if (this._exchangeRateInterval) {
            clearInterval(this._exchangeRateInterval);
        }
        // Poll exchange rate every 5 minutes, matching MarketWidgetManager loop
        this._exchangeRateInterval = setInterval(async () => {
            await this.fetchExchangeRate(false);
        }, 300000);
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
                    if (!item.portfolio) {
                        item.portfolio = NetWorthPortfolioService.DEFAULT_PORTFOLIO;
                    }
                });
            }

            const rawSnap = localStorage.getItem(this.snapshotStorageKey);
            this.snapshots = rawSnap ? JSON.parse(rawSnap) : {};
            if (this.snapshots && Array.isArray(this.snapshots._customPortfolios)) {
                NetWorthPortfolioService.setPortfolios(this, this.snapshots._customPortfolios);
            }
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

    addItem(name, type, category, amount, portfolio = NetWorthPortfolioService.DEFAULT_PORTFOLIO) {
        if (!name || isNaN(amount) || amount <= 0) return false;

        const rate = this.exchangeRate > 0 ? this.exchangeRate : 35.5;
        const numAmount = parseFloat(amount);
        const thbAmount = this.currency === 'USD' ? numAmount * rate : numAmount;

        const newItem = {
            id: Date.now().toString(),
            name,
            type,
            category,
            portfolio: portfolio || NetWorthPortfolioService.DEFAULT_PORTFOLIO,
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

    addVolatileItem(name, type, category, symbol, quantity, avgCost, currentPrice, portfolio = NetWorthPortfolioService.DEFAULT_PORTFOLIO) {
        if (!name) {
            NetWorthCardRenderer.showAppleAlertModal('Incomplete Information', 'Please enter an Item Name.');
            return false;
        }
        const numQty = parseFloat(quantity);
        const numCost = parseFloat(avgCost) || 0;
        const numPrice = parseFloat(currentPrice);

        if (isNaN(numQty) || numQty <= 0) {
            NetWorthCardRenderer.showAppleAlertModal('Invalid Quantity', 'Please enter a valid positive holding quantity.');
            return false;
        }
        if (isNaN(numPrice) || numPrice <= 0) {
            NetWorthCardRenderer.showAppleAlertModal('Invalid Price', 'Please enter a valid positive market price.');
            return false;
        }

        const metrics = NetWorthVolatileAssetService.calculateMetrics(
            numQty,
            numCost,
            numPrice,
            'USD',
            this.exchangeRate
        );

        const newItem = {
            id: Date.now().toString(),
            name,
            type,
            category,
            portfolio: portfolio || NetWorthPortfolioService.DEFAULT_PORTFOLIO,
            isVolatile: true,
            symbol: NetWorthVolatileAssetService.normalizeSymbol(symbol) || 'ASSET',
            quantity: metrics.quantity,
            avgCost: metrics.avgCost,
            currentPrice: metrics.currentPrice,
            assetCurrency: 'USD',
            amount: metrics.amountInThb,
            currency: 'THB',
            unrealizedPnl: metrics.unrealizedPnl,
            unrealizedPnlThb: metrics.pnlInThb,
            unrealizedPnlPercent: metrics.unrealizedPnlPercent,
            date: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.items.unshift(newItem);
        this.updateWeeklySnapshot();
        this.saveData();
        this.render();
        return true;
    }

    editVolatileItem(id, data) {
        const item = this.items.find(i => i.id === id);
        if (!item) return false;

        const numQty = parseFloat(data.quantity);
        const numCost = parseFloat(data.avgCost) || 0;
        const numPrice = parseFloat(data.currentPrice);

        if (!data.name || isNaN(numQty) || numQty <= 0 || isNaN(numPrice) || numPrice <= 0) {
            NetWorthCardRenderer.showAppleAlertModal('Invalid Data', 'Please ensure name, quantity, and market price are valid.');
            return false;
        }

        const metrics = NetWorthVolatileAssetService.calculateMetrics(
            numQty,
            numCost,
            numPrice,
            item.assetCurrency || 'USD',
            this.exchangeRate
        );

        item.name = data.name.trim();
        item.category = data.category;
        if (data.portfolio) item.portfolio = data.portfolio;
        item.symbol = NetWorthVolatileAssetService.normalizeSymbol(data.symbol) || item.symbol || 'ASSET';
        item.quantity = metrics.quantity;
        item.avgCost = metrics.avgCost;
        item.currentPrice = metrics.currentPrice;
        item.amount = metrics.amountInThb;
        item.unrealizedPnl = metrics.unrealizedPnl;
        item.unrealizedPnlThb = metrics.pnlInThb;
        item.unrealizedPnlPercent = metrics.unrealizedPnlPercent;
        item.updatedAt = new Date().toISOString();

        this.updateWeeklySnapshot();
        this.saveData();
        this.render();
        return true;
    }

    async updateSingleVolatilePrice(id) {
        const item = this.items.find(i => i.id === id);
        if (!item || !item.isVolatile || !item.symbol) return { success: false, error: 'Not a volatile asset with symbol' };

        const result = await NetWorthVolatileAssetService.fetchLivePrice(item.symbol);
        if (result.success && result.price) {
            const metrics = NetWorthVolatileAssetService.calculateMetrics(
                item.quantity,
                item.avgCost,
                result.price,
                item.assetCurrency || 'USD',
                this.exchangeRate
            );
            item.currentPrice = result.price;
            item.amount = metrics.amountInThb;
            item.unrealizedPnl = metrics.unrealizedPnl;
            item.unrealizedPnlThb = metrics.pnlInThb;
            item.unrealizedPnlPercent = metrics.unrealizedPnlPercent;
            item.updatedAt = new Date().toISOString();

            this.updateWeeklySnapshot();
            await this.saveData();
            this.render();
            return { success: true, price: result.price, symbol: item.symbol };
        }
        return { success: false, error: result.error || 'Could not fetch price' };
    }

    async refreshAllVolatilePrices() {
        const btn = document.getElementById('nw-btn-refresh-prices');
        const icon = btn ? btn.querySelector('svg, i') : null;
        if (icon) icon.classList.add('animate-spin');

        try {
            // Force refresh live exchange rate on manual refresh
            await this.fetchExchangeRate(true);

            const { updatedCount, failedCount } = await NetWorthVolatileAssetService.refreshAllVolatileItems(this);
            if (window.ShareUI && window.ShareUI.showToast) {
                if (updatedCount > 0) {
                    window.ShareUI.showToast('Prices Refreshed', `Updated ${updatedCount} volatile assets & exchange rate (฿${this.exchangeRate.toFixed(2)})${failedCount > 0 ? ` (${failedCount} failed)` : ''}`, 'success');
                } else if (failedCount > 0) {
                    window.ShareUI.showToast('Notice', `Could not update ${failedCount} assets. Check connection or symbols.`, 'error');
                } else {
                    window.ShareUI.showToast('Notice', `USD/THB rate refreshed: ฿${this.exchangeRate.toFixed(2)}`, 'info');
                }
            }
        } finally {
            const currentBtn = document.getElementById('nw-btn-refresh-prices');
            const currentIcon = currentBtn ? currentBtn.querySelector('svg, i') : icon;
            if (currentIcon) currentIcon.classList.remove('animate-spin');
        }
    }

    async autoRefreshOnLoad() {
        const now = Date.now();
        // 30-second cooldown to avoid rate-limiting on rapid tab switching
        if (now - this._lastAutoRefresh < 30000) return;
        this._lastAutoRefresh = now;

        await NetWorthSyncService.pullLatestFromCloud(this);
        await this.fetchExchangeRate(false);

        const hasVolatile = (this.items || []).some(i => i.isVolatile && i.symbol);
        if (hasVolatile) {
            await this.refreshAllVolatilePrices();
        }
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

    editItem(id, newName, newCategory, newAmount, newPortfolio) {
        const item = this.items.find(i => i.id === id);
        if (!item) return false;

        const parsedAmount = parseFloat(newAmount);
        if (!newName || isNaN(parsedAmount) || parsedAmount <= 0) return false;

        const rate = this.exchangeRate > 0 ? this.exchangeRate : 35.5;
        const thbAmount = this.currency === 'USD' ? parsedAmount * rate : parsedAmount;

        item.name = newName.trim();
        item.category = newCategory;
        if (newPortfolio) item.portfolio = newPortfolio;
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
        const inactiveClasses = ['bg-slate-800/80', 'text-slate-400'];

        [btnAll, btnAsset, btnLiability].forEach(btn => {
            if (!btn) return;
            btn.className = 'px-2.5 sm:px-3 py-1 text-xs font-mono font-bold rounded-xl transition border-0 cursor-pointer text-center ';
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

    async fetchAndDisplayVolatilePrice(symbol) {
        if (!symbol || !symbol.trim()) return;
        const cleanSymbol = symbol.trim().toUpperCase();
        const displayMarketPrice = document.getElementById('nw-display-market-price');
        const displayPriceSource = document.getElementById('nw-display-price-source');
        const btnRefetchMarket = document.getElementById('nw-btn-refetch-market');
        const nameVolatile = document.getElementById('nw-input-name-volatile');

        if (displayMarketPrice) displayMarketPrice.innerText = 'Fetching...';
        if (displayPriceSource) displayPriceSource.classList.add('hidden');
        const icon = btnRefetchMarket ? btnRefetchMarket.querySelector('svg, i') : null;
        if (icon) icon.classList.add('animate-spin');

        try {
            const res = await NetWorthVolatileAssetService.fetchLivePrice(cleanSymbol);

            if (res.success && res.price) {
                this.activeVolatileMarketPrice = res.price;
                this.activeVolatileCurrency = res.currency || 'USD';

                const isCrypto = NetWorthVolatileAssetService.KNOWN_CRYPTO.has(cleanSymbol) || !!NetWorthVolatileAssetService.COINGECKO_MAP[cleanSymbol];
                const category = isCrypto ? 'Crypto' : 'Stocks / ETFs';
                this.activeVolatileCategory = category;
                const textCategory = document.getElementById('nw-text-category-volatile');
                if (textCategory) textCategory.innerText = category;

                if (displayMarketPrice) {
                    const prefix = res.currency === 'USD' ? '$' : '฿';
                    displayMarketPrice.innerText = `${prefix}${res.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`;
                }
                if (displayPriceSource) {
                    displayPriceSource.innerText = res.source || 'Market';
                    displayPriceSource.classList.remove('hidden');
                }
                if (nameVolatile && !nameVolatile.value.trim()) {
                    nameVolatile.value = res.symbol;
                }
                this.updateVolatilePreview();
                if (window.ShareUI && window.ShareUI.showToast) {
                    window.ShareUI.showToast('Price Fetched', `${res.symbol} (${res.source || 'Market'}): $${res.price.toLocaleString()}`, 'success');
                }
            } else if (res.needApiKey) {
                if (displayMarketPrice) displayMarketPrice.innerText = 'Key needed';
                NetWorthCardRenderer.showFinnhubKeyModal((savedKey) => {
                    if (savedKey) this.fetchAndDisplayVolatilePrice(cleanSymbol);
                });
            } else {
                this.activeVolatileMarketPrice = null;
                if (displayMarketPrice) displayMarketPrice.innerText = 'Unavailable';
                this.updateVolatilePreview();
                NetWorthCardRenderer.showAppleAlertModal('Auto-Fetch Unavailable', `Could not fetch live price for "${cleanSymbol}". Please verify the symbol.`);
            }
        } finally {
            const currentBtn = document.getElementById('nw-btn-refetch-market');
            const currentIcon = currentBtn ? currentBtn.querySelector('svg, i') : icon;
            if (currentIcon) currentIcon.classList.remove('animate-spin');
        }
    }

    updateVolatilePreview() {
        const previewVal = document.getElementById('nw-preview-val');
        const previewPnl = document.getElementById('nw-preview-pnl');
        const qtyInput = document.getElementById('nw-input-qty');
        const costInput = document.getElementById('nw-input-avg-cost');
        if (!previewVal || !previewPnl) return;

        const q = parseFloat(qtyInput?.value) || 0;
        const c = parseFloat(costInput?.value) || 0;
        const p = this.activeVolatileMarketPrice || 0;

        const val = q * p;
        const pnl = (p - c) * q;
        const pnlPct = c > 0 ? ((p - c) / c) * 100 : 0;
        const isProfit = pnl >= 0;

        const symbol = this.currency === 'THB' ? '฿' : '$';
        const rate = this.exchangeRate > 0 ? this.exchangeRate : 35.5;
        const displayVal = this.currency === 'THB' ? (val * rate) : val;

        previewVal.innerText = `${symbol}${displayVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        previewPnl.className = `font-bold text-[11px] tabular-nums ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`;
        previewPnl.innerText = `${isProfit ? '+' : ''}${pnlPct.toFixed(2)}% (${isProfit ? '+' : ''}$${pnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }

    bindEvents() {
        const tabStandard = document.getElementById('nw-tab-standard');
        const tabVolatile = document.getElementById('nw-tab-volatile');
        const panelStandard = document.getElementById('nw-panel-standard');
        const panelVolatile = document.getElementById('nw-panel-volatile');

        if (tabStandard && tabVolatile && panelStandard && panelVolatile) {
            tabStandard.onclick = () => {
                this.playClickSound();
                panelStandard.classList.remove('hidden');
                panelVolatile.classList.add('hidden');
                tabStandard.className = 'px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-emerald-500/20 text-emerald-300 transition cursor-pointer';
                tabVolatile.className = 'px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg text-slate-400 hover:text-cyan-300 transition cursor-pointer';
                requestAnimationFrame(() => this.syncCardsHeight());
            };

            tabVolatile.onclick = () => {
                this.playClickSound();
                panelStandard.classList.add('hidden');
                panelVolatile.classList.remove('hidden');
                tabVolatile.className = 'px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg bg-cyan-500/20 text-cyan-300 transition cursor-pointer';
                tabStandard.className = 'px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg text-slate-400 hover:text-emerald-300 transition cursor-pointer';
                if (window.lucide) window.lucide.createIcons();
                requestAnimationFrame(() => this.syncCardsHeight());
            };
        }

        const formCard = document.getElementById('nw-card-form');
        if (formCard && window.ResizeObserver) {
            this._formResizeObserver = new ResizeObserver(() => {
                this.syncCardsHeight();
            });
            this._formResizeObserver.observe(formCard);
        }
        window.addEventListener('resize', () => this.syncCardsHeight());

        const searchAssetInput = document.getElementById('nw-search-asset');
        const searchDropdown = document.getElementById('nw-search-dropdown');
        const symInput = document.getElementById('nw-input-symbol');
        const nameVolatile = document.getElementById('nw-input-name-volatile');
        const catVolatile = document.getElementById('nw-input-category-volatile');

        if (searchAssetInput && searchDropdown) {
            let searchTimer = null;
            searchAssetInput.addEventListener('input', () => {
                clearTimeout(searchTimer);
                const query = searchAssetInput.value.trim();
                if (!query) {
                    searchDropdown.classList.add('hidden');
                    searchDropdown.innerHTML = '';
                    return;
                }
                searchTimer = setTimeout(async () => {
                    const results = await NetWorthVolatileAssetService.searchAssets(query);
                    if (results.length === 0) {
                        searchDropdown.innerHTML = `<div class="px-3 py-2 text-xs font-mono text-slate-400">No assets found for "${query}"</div>`;
                        searchDropdown.classList.remove('hidden');
                        return;
                    }
                    searchDropdown.innerHTML = results.map(item => `
                        <div class="nw-search-item px-3 py-2 hover:bg-cyan-500/20 cursor-pointer flex items-center justify-between transition"
                             data-symbol="${item.symbol}"
                             data-name="${item.name}"
                             data-category="${item.category}"
                             data-type="${item.type}">
                            <div class="flex items-center gap-2 overflow-hidden">
                                <span class="font-bold text-xs text-cyan-300 font-mono">${item.symbol}</span>
                                <span class="text-[11px] text-slate-300 truncate max-w-[140px] font-mono">${item.name}</span>
                            </div>
                            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">${item.type}</span>
                        </div>
                    `).join('');
                    searchDropdown.classList.remove('hidden');

                    searchDropdown.querySelectorAll('.nw-search-item').forEach(el => {
                        el.onclick = () => {
                            this.playClickSound();
                            const sym = el.dataset.symbol;
                            const name = el.dataset.name;
                            const cat = el.dataset.category || 'Stocks / ETFs';
                            if (symInput) symInput.value = sym;
                            if (nameVolatile) nameVolatile.value = name;
                            this.activeVolatileCategory = cat;
                            const textCategory = document.getElementById('nw-text-category-volatile');
                            if (textCategory) textCategory.innerText = cat;
                            searchDropdown.classList.add('hidden');
                            searchAssetInput.value = '';
                            this.fetchAndDisplayVolatilePrice(sym);
                        };
                    });
                }, 200);
            });

            document.addEventListener('click', (e) => {
                if (!searchAssetInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                    searchDropdown.classList.add('hidden');
                }
            });
        }

        if (symInput) {
            symInput.addEventListener('change', () => {
                const sym = symInput.value.trim();
                if (sym) this.fetchAndDisplayVolatilePrice(sym);
            });
        }

        const btnRefetchMarket = document.getElementById('nw-btn-refetch-market');
        if (btnRefetchMarket) {
            btnRefetchMarket.onclick = () => {
                const sym = symInput ? symInput.value.trim() : '';
                if (sym) {
                    this.playClickSound();
                    this.fetchAndDisplayVolatilePrice(sym);
                } else {
                    NetWorthCardRenderer.showAppleAlertModal('Symbol Required', 'Please search or enter an asset ticker first.');
                }
            };
        }

        const qtyInput = document.getElementById('nw-input-qty');
        const costInput = document.getElementById('nw-input-avg-cost');
        if (qtyInput) qtyInput.addEventListener('input', () => this.updateVolatilePreview());
        if (costInput) costInput.addEventListener('input', () => this.updateVolatilePreview());

        const btnFinnhubKey = document.getElementById('nw-btn-finnhub-key');
        if (btnFinnhubKey) {
            btnFinnhubKey.onclick = () => {
                this.playClickSound();
                NetWorthCardRenderer.showFinnhubKeyModal();
            };
        }

        const btnRefreshAll = document.getElementById('nw-btn-refresh-prices');
        if (btnRefreshAll) {
            btnRefreshAll.onclick = () => {
                this.playClickSound();
                this.refreshAllVolatilePrices();
            };
        }

        const btnNewPortfolio = document.getElementById('nw-btn-new-portfolio');
        if (btnNewPortfolio) {
            btnNewPortfolio.onclick = () => {
                this.playClickSound();
                NetWorthCardRenderer.showCreatePortfolioModal(this, (newName) => {
                    this.populatePortfolioDropdowns(newName);
                    this.render();
                });
            };
        }

        const btnQuickPortStandard = document.getElementById('nw-btn-add-portfolio-quick');
        if (btnQuickPortStandard) {
            btnQuickPortStandard.onclick = () => {
                this.playClickSound();
                NetWorthCardRenderer.showCreatePortfolioModal(this, (newName) => {
                    this.populatePortfolioDropdowns(newName);
                    this.render();
                });
            };
        }

        const btnQuickPortVolatile = document.getElementById('nw-btn-add-portfolio-volatile-quick');
        if (btnQuickPortVolatile) {
            btnQuickPortVolatile.onclick = () => {
                this.playClickSound();
                NetWorthCardRenderer.showCreatePortfolioModal(this, (newName) => {
                    this.populatePortfolioDropdowns(newName);
                    this.render();
                });
            };
        }

        const btnAddStandard = document.getElementById('nw-btn-add');
        if (btnAddStandard) {
            btnAddStandard.onclick = () => {
                const nameEl = document.getElementById('nw-input-name');
                const typeEl = document.getElementById('nw-input-type');
                const catEl = document.getElementById('nw-input-category');
                const amtEl = document.getElementById('nw-input-amount');
                const portEl = document.getElementById('nw-input-portfolio');

                if (!nameEl || !typeEl || !catEl) return;
                const name = nameEl.value.trim();
                const type = typeEl.value;
                const category = catEl.value;
                const amount = parseFloat(amtEl ? amtEl.value : '');
                const portfolio = portEl ? portEl.value : NetWorthPortfolioService.DEFAULT_PORTFOLIO;

                if (!name) {
                    NetWorthCardRenderer.showAppleAlertModal('Item Name Required', 'Please enter an Item Name before adding to your portfolio.');
                    return;
                }
                if (isNaN(amount) || amount <= 0) {
                    NetWorthCardRenderer.showAppleAlertModal('Invalid Amount', 'Please enter a valid positive amount value.');
                    return;
                }

                if (this.addItem(name, type, category, amount, portfolio)) {
                    nameEl.value = '';
                    if (amtEl) amtEl.value = '';
                }
            };
        }

        const btnAddVolatile = document.getElementById('nw-btn-add-volatile');
        if (btnAddVolatile) {
            btnAddVolatile.onclick = () => {
                const sym = symInput ? symInput.value.trim() : '';
                const name = (nameVolatile ? nameVolatile.value.trim() : '') || sym;
                const category = this.activeVolatileCategory || 'Stocks / ETFs';
                const qty = qtyInput ? qtyInput.value : '';
                const avgCost = costInput ? costInput.value : '';
                const mktPrice = this.activeVolatileMarketPrice;
                const portEl = document.getElementById('nw-input-portfolio-volatile');
                const portfolio = portEl ? portEl.value : NetWorthPortfolioService.DEFAULT_PORTFOLIO;

                if (!sym) {
                    NetWorthCardRenderer.showAppleAlertModal('Symbol Required', 'Please search or select an asset ticker first.');
                    return;
                }
                if (!mktPrice || mktPrice <= 0) {
                    NetWorthCardRenderer.showAppleAlertModal('Market Price Missing', 'Waiting for live market price. Please click 🔄 to fetch live price before adding.');
                    return;
                }
                if (!qty || parseFloat(qty) <= 0) {
                    NetWorthCardRenderer.showAppleAlertModal('Units Required', 'Please enter valid holding units (quantity).');
                    return;
                }
                if (!avgCost || parseFloat(avgCost) < 0) {
                    NetWorthCardRenderer.showAppleAlertModal('Cost Required', 'Please enter your average buy cost per unit.');
                    return;
                }

                if (this.addVolatileItem(name, 'ASSET', category, sym, qty, avgCost, mktPrice, portfolio)) {
                    if (nameVolatile) nameVolatile.value = '';
                    if (symInput) symInput.value = '';
                    if (qtyInput) qtyInput.value = '';
                    if (costInput) costInput.value = '';
                    this.activeVolatileMarketPrice = null;
                    this.activeVolatileCategory = 'Stocks / ETFs';
                    const displayMarketPrice = document.getElementById('nw-display-market-price');
                    const displayPriceSource = document.getElementById('nw-display-price-source');
                    const textCategory = document.getElementById('nw-text-category-volatile');
                    if (displayMarketPrice) displayMarketPrice.innerText = 'Select asset';
                    if (displayPriceSource) displayPriceSource.classList.add('hidden');
                    if (textCategory) textCategory.innerText = 'Stocks / ETFs';
                    this.updateVolatilePreview();
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
        let totalCash = 0;
        let totalCostVolatile = 0;
        let totalPnlVolatile = 0;

        const rate = this.exchangeRate > 0 ? this.exchangeRate : 35.5;

        this.items.forEach(item => {
            const convertedAmt = this.getItemConvertedAmount(item);
            if (item.type === 'ASSET') {
                totalAssets += convertedAmt;
                if (item.category === 'Cash & Bank') {
                    totalCash += convertedAmt;
                }
            } else if (item.type === 'LIABILITY') {
                totalLiabilities += convertedAmt;
            }

            if (item.isVolatile && item.symbol) {
                const costRaw = (parseFloat(item.quantity) || 0) * (parseFloat(item.avgCost) || 0);
                const pnlRaw = parseFloat(item.unrealizedPnl) || 0;

                if (this.currency === 'USD') {
                    totalCostVolatile += costRaw;
                    totalPnlVolatile += pnlRaw;
                } else {
                    totalCostVolatile += (costRaw * rate);
                    totalPnlVolatile += (item.unrealizedPnlThb || (pnlRaw * rate));
                }
            }
        });

        const netWorth = totalAssets - totalLiabilities;
        const pnlPercentVolatile = totalCostVolatile > 0 ? (totalPnlVolatile / totalCostVolatile) * 100 : 0;

        return { 
            totalAssets, 
            totalLiabilities, 
            netWorth, 
            totalCash, 
            totalPnlVolatile, 
            pnlPercentVolatile 
        };
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
        const { 
            totalAssets, 
            totalLiabilities, 
            netWorth, 
            totalCash, 
            totalPnlVolatile, 
            pnlPercentVolatile 
        } = this.calculateTotals();

        const elAssets = document.getElementById('nw-total-assets');
        const elLiabilities = document.getElementById('nw-total-liabilities');
        const elNetWorth = document.getElementById('nw-net-worth');
        const elCash = document.getElementById('nw-total-cash');
        const elProfit = document.getElementById('nw-net-profit');
        const elProfitSub = document.getElementById('nw-net-profit-sub');

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

        if (elCash) elCash.innerText = formatVal(totalCash);

        if (elProfit) {
            const isProfit = totalPnlVolatile >= 0;
            const sign = isProfit ? '+' : '-';
            const absPnl = Math.abs(totalPnlVolatile);
            elProfit.innerText = `${sign}${formatVal(absPnl)}`;
            elProfit.className = `text-lg sm:text-2xl font-mono font-bold mt-2 tabular-nums ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`;
        }

        if (elProfitSub) {
            const isProfit = totalPnlVolatile >= 0;
            const sign = isProfit ? '+' : '';
            elProfitSub.innerText = `${sign}${pnlPercentVolatile.toFixed(2)}% Unrealized P&L`;
            elProfitSub.className = `text-[9px] sm:text-[10px] font-mono mt-1 hidden xs:block ${isProfit ? 'text-emerald-500/80' : 'text-rose-500/80'}`;
        }

        NetWorthChartEngine.updateCategoryPieCharts(this);
        NetWorthChartEngine.updateHistoryChart(this, this.get52WeekHistory());
    }

    renderList() {
        NetWorthCardRenderer.renderList(this);
    }

    syncCardsHeight() {
        const formCard = document.getElementById('nw-card-form');
        const recordsCard = document.getElementById('nw-card-records');
        if (!formCard || !recordsCard) return;

        if (window.innerWidth >= 1024) {
            const formHeight = formCard.offsetHeight;
            if (formHeight > 0) {
                recordsCard.style.height = `${formHeight}px`;
                recordsCard.style.maxHeight = `${formHeight}px`;
            }
        } else {
            recordsCard.style.height = '';
            recordsCard.style.maxHeight = 'min(580px, 72vh)';
        }
    }

    populatePortfolioDropdowns(selectedPortfolio = null) {
        const portfolios = NetWorthPortfolioService.getPortfolios(this);
        const selects = [
            document.getElementById('nw-input-portfolio'),
            document.getElementById('nw-input-portfolio-volatile')
        ].filter(Boolean);

        selects.forEach(select => {
            const currentVal = selectedPortfolio || select.value || NetWorthPortfolioService.DEFAULT_PORTFOLIO;
            select.innerHTML = portfolios.map(p => `
                <option value="${p}">${p}</option>
            `).join('');
            if (portfolios.includes(currentVal)) {
                select.value = currentVal;
            } else {
                select.value = NetWorthPortfolioService.DEFAULT_PORTFOLIO;
            }
        });
    }

    render() {
        this.updateToggleUI();
        this.updateRateDisplayUI();
        this.populatePortfolioDropdowns();
        this.checkWeeklyUpdateReminder();
        this.renderSummary();
        this.renderList();
        if (window.lucide) {
            window.lucide.createIcons();
        }
        requestAnimationFrame(() => this.syncCardsHeight());
    }
}
