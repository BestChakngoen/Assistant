import { AuthService } from './services/AuthService.js';
import { DataService } from './services/DataService.js';
import { MarketService } from './services/MarketService.js';
import { UIManager } from './ui/UIManager.js';
import { RiskCalculator } from './app/RiskCalculator.js';
import { NoteHandler } from './app/NoteHandler.js';
import { TradeActionsHandler } from './app/TradeActionsHandler.js';
import { MarketWidgetManager } from './app/MarketWidgetManager.js';
import { NetWorthManager } from './app/NetWorthManager.js';
import { SystemSettingsManager } from './app/SystemSettingsManager.js';
import { TradeDisciplineManager } from './app/TradeDisciplineManager.js';

/**
 * TradeApp - Main Application Facade Coordinator
 * Coordinates Auth, Data, UI, Risk Management, Notes, Trade Actions, and Market Widgets.
 */
export class TradeApp {
    constructor(userFirebaseConfig, appId = 'default-app-id') {
        this.auth = new AuthService(userFirebaseConfig);
        this.data = new DataService(this.auth.app, userFirebaseConfig, appId);
        this.market = new MarketService();
        this.ui = new UIManager();

        this.trades = [];

        // Specialized Sub-modules
        this._riskCalc = new RiskCalculator(this);
        this._noteHandler = new NoteHandler(this);
        this._tradeActions = new TradeActionsHandler(this);
        this._marketWidgets = new MarketWidgetManager(this);
        this._netWorth = new NetWorthManager();
        this._settingsManager = new SystemSettingsManager();
        this._disciplineManager = new TradeDisciplineManager(this);

        this.initListeners();
    }

    get notes() {
        return this._noteHandler.notes;
    }

    set notes(val) {
        this._noteHandler.notes = val;
    }

    getThaiDateString() {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    }

    initListeners() {
        // Auth State Listener
        this.auth.onStateChange(async (user) => {
            if (user) {
                this.ui.showLogin(false);
                
                const displayName = user.isAnonymous ? '// GUEST' : `// ${user.email}`;
                const userDisplayEl = document.getElementById('user-display-name');
                if (userDisplayEl) userDisplayEl.innerText = displayName;
                
                const topUserDisplay = document.getElementById('top-user-display');
                if (topUserDisplay) topUserDisplay.innerText = displayName;

                // Refresh ShareManager feed for current user
                if (this.ui && this.ui.share) {
                    this.ui.share.loadItems();
                }

                // Trigger NetWorth Supabase Sync
                if (this._netWorth) {
                    this._netWorth.initSupabaseSync();
                }
                
                // Subscribe to Trades
                this.data.subscribeTrades(user.uid, (data, meta) => {
                    this.trades = data;
                    this.ui.renderTradeList(data, (id) => this.handleDelete(id));
                    this.ui.updateStats(data);
                    if (this._disciplineManager) {
                        this._disciplineManager.updateUI(data);
                    }
                    if (meta) this.ui.updateCloudStats(meta);
                }, (err) => console.error(err));

                // Subscribe to Strategy Diagram
                if (this.ui.diagram) {
                    this.data.subscribeDiagram(user.uid, (shapes) => {
                        if (shapes && shapes.length > 0) {
                            this.ui.diagram.shapes = shapes;
                            this.ui.diagram.draw();
                        } else if (this.ui.diagram.shapes.length > 0) {
                            this.data.saveDiagram(user.uid, this.ui.diagram.shapes).catch(err => console.error("Firestore diagram seed error:", err));
                        }
                    });

                    this.ui.diagram.onSaveCallback = (shapes) => {
                        this.data.saveDiagram(user.uid, shapes).catch(err => console.error("Firestore diagram save error:", err));
                    };
                }

                // Initialize Health Track Managers
                if (!this.healthInitialized) {
                    await this.initHealthTrack();
                }

                this.startMarketLoops();
            } else {
                this.ui.showLogin(true);
                if (this.ui.diagram) {
                    this.ui.diagram.onSaveCallback = null;
                }
                if (this.data.unsubscribeDiagram) {
                    this.data.unsubscribeDiagram();
                }
            }
        });

        // Delegate Risk Calculator Listeners
        this._riskCalc.initListeners();

        // Button Click Handlers
        const btnLogin = document.getElementById('btn-login');
        if (btnLogin) btnLogin.onclick = () => this.handleLogin();

        const btnGuest = document.getElementById('btn-login-guest');
        if (btnGuest) btnGuest.onclick = () => this.handleLoginGuest();

        const btnLogout = document.getElementById('btn-logout');
        if (btnLogout) btnLogout.onclick = () => this.auth.logout();

        const btnCopyDomain = document.getElementById('btn-copy-domain');
        if (btnCopyDomain) btnCopyDomain.onclick = () => this.copyDomain();

        const btnAddTrade = document.getElementById('btn-add-trade');
        if (btnAddTrade) btnAddTrade.onclick = () => this.handleAddTrade();

        const btnManageAssets = document.getElementById('btn-manage-assets');
        if (btnManageAssets) btnManageAssets.onclick = () => this._tradeActions.showManageAssetsModal();

        const btnReset = document.getElementById('btn-reset');
        if (btnReset) btnReset.onclick = () => this.handleReset();

        const btnExport = document.getElementById('btn-export');
        if (btnExport) btnExport.onclick = () => this.handleExport();

        const btnImportTrigger = document.getElementById('btn-import-trigger');
        if (btnImportTrigger) btnImportTrigger.onclick = () => document.getElementById('file-import').click();

        const fileImport = document.getElementById('file-import');
        if (fileImport) fileImport.onchange = (e) => this.handleImport(e);

        const btnSetToday = document.getElementById('btn-set-today');
        if (btnSetToday) {
            btnSetToday.onclick = () => {
                if (this.ui.dom.inputs.date) {
                    this.ui.dom.inputs.date.value = this.getThaiDateString();
                    if (this._disciplineManager) this._disciplineManager.updateUI(this.trades);
                }
            };
        }

        // Tab Navigation
        const bindTab = (id, target) => {
            const el = document.getElementById(id);
            if (el) el.onclick = () => this.ui.switchTab(target);
        };

        const tabCode = document.getElementById('tab-code');
        if (tabCode) {
            tabCode.onclick = () => {
                this.ui.switchTab('code');
                if (this._disciplineManager) this._disciplineManager.updateUI(this.trades);
            };
        }
        bindTab('tab-issues', 'issues');
        bindTab('tab-pulls', 'pulls');

        const tabWiki = document.getElementById('tab-wiki');
        if (tabWiki) {
            tabWiki.onclick = () => {
                this.ui.switchTab('wiki');
                const savedCurrency = this.getSavedNewsCurrency();
                const container = document.getElementById('economic-calendar-container');
                if (container && (!container.children.length || container.dataset.activeCurrency !== savedCurrency)) {
                    this.initEconomicCalendar(savedCurrency);
                }
            };
        }

        bindTab('tab-share', 'share');
        
        const tabNetWorth = document.getElementById('tab-networth');
        if (tabNetWorth) {
            tabNetWorth.onclick = () => {
                this.ui.switchTab('networth');
                if (this._netWorth) this._netWorth.render();
            };
        }

        bindTab('tab-game', 'game');
        
        const tabSettings = document.getElementById('tab-settings');
        if (tabSettings) {
            tabSettings.onclick = () => {
                this.ui.switchTab('settings');
                if (this._settingsManager) this._settingsManager.updateQuotaStats();
            };
        }

        const tabActions = document.getElementById('tab-actions');
        if (tabActions) {
            tabActions.onclick = () => {
                this.ui.switchTab('actions');
                const savedSymbol = this.getSavedMarketSymbol();
                const container = document.getElementById('tv-chart-container');
                if (container && (!container.children.length || container.dataset.activeSymbol !== savedSymbol)) {
                    this.initTradingView(savedSymbol);
                } else if (this._marketWidgets) {
                    this._marketWidgets.renderAssetInfo(savedSymbol);
                }
            };
        }

        // Inputs & Quick Actions
        const inputType = document.getElementById('input-type');
        if (inputType) inputType.onchange = () => this.ui.toggleInputStyle();

        const inputAsset = document.getElementById('input-asset');
        if (inputAsset) inputAsset.onchange = () => this.ui.toggleInputStyle();

        const btnQuickDeposit = document.getElementById('btn-quick-deposit');
        if (btnQuickDeposit) btnQuickDeposit.onclick = () => this.setQuickType('DEPOSIT');

        const btnQuickWithdraw = document.getElementById('btn-quick-withdraw');
        if (btnQuickWithdraw) btnQuickWithdraw.onclick = () => this.setQuickType('WITHDRAW');

        // Market Assets Buttons
        const savedSymbol = this.getSavedMarketSymbol();
        const marketAssets = [
            { s: 'BINANCE:BTCUSDT', n: 'BTC/USDT' },
            { s: 'OANDA:XAUUSD', n: 'GOLD (XAU)' },
            { s: 'OANDA:XAGUSD', n: 'SILVER (XAG)' },
            { s: 'TVC:USOIL', n: 'OIL (USOIL)' },
            { s: 'CAPITALCOM:COPPER', n: 'COPPER' },
            { s: 'CAPITALCOM:WHEAT', n: 'WHEAT' },
            { s: 'CAPITALCOM:CORN', n: 'CORN' },
            { s: 'CAPITALCOM:LIVECATTLE', n: 'LIVE CATTLE' },
            { s: 'CAPITALCOM:LEANHOGS', n: 'LEAN HOGS' },
            { s: 'CAPITALCOM:DXY', n: 'DXY' },
            { s: 'CAPITALCOM:US100', n: 'NASDAQ 100' },
            { s: 'FX:EURUSD', n: 'EUR/USD' },
            { s: 'FX_IDC:USDTHB', n: 'USD/THB' }
        ];
        const container = document.getElementById('market-assets-container');
        if (container) {
            container.innerHTML = '<span class="px-3 text-slate-400 font-mono text-xs uppercase tracking-wider hidden md:inline shrink-0 font-bold">ASSET:</span>';
            marketAssets.forEach(m => {
                const isSelected = (m.s === savedSymbol);
                const b = document.createElement('button');
                b.className = `asset-btn btn-press shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg font-mono text-xs border transition-all ${
                    isSelected ? 'border-cyan-500 text-cyan-400 font-bold bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.15)]' : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`;
                b.innerText = m.n;
                b.onclick = () => {
                    document.querySelectorAll('.asset-btn').forEach(x => {
                        x.classList.remove('border-cyan-500', 'text-cyan-400', 'font-bold', 'bg-cyan-500/10', 'shadow-[0_0_10px_rgba(6,182,212,0.15)]');
                        x.classList.add('border-slate-800', 'text-slate-400');
                    });
                    b.classList.remove('border-slate-800', 'text-slate-400');
                    b.classList.add('border-cyan-500', 'text-cyan-400', 'font-bold', 'bg-cyan-500/10', 'shadow-[0_0_10px_rgba(6,182,212,0.15)]');
                    this.saveMarketSymbol(m.s);
                    this.initTradingView(m.s);
                };
                container.appendChild(b);
            });

            // Enable smooth horizontal scrolling with mouse wheel
            container.addEventListener('wheel', (e) => {
                if (e.deltaY !== 0) {
                    e.preventDefault();
                    container.scrollLeft += e.deltaY;
                }
            }, { passive: false });
        }

        // Initial UI Date & Market Rates
        const inputDate = document.getElementById('input-date');
        if (inputDate) inputDate.value = this.getThaiDateString();
        this.updateTHB();
    }

    // --- Delegation Handlers ---

    async handleLogin() {
        const status = document.getElementById('login-status');
        if (status) status.innerText = "Contacting Identity Provider...";
        const errBox = document.getElementById('auth-error-box');
        if (errBox) errBox.classList.add('hidden');
        try {
            await this.auth.login();
        } catch (error) {
            if (error.code === 'auth/unauthorized-domain' || (error.message && error.message.includes('unauthorized-domain'))) {
                this.ui.showAuthError(true);
            } else {
                this.ui.showAuthError(false);
            }
        }
    }

    async handleLoginGuest() {
        const status = document.getElementById('login-status');
        if (status) status.innerText = "Entering as Guest...";
        const errBox = document.getElementById('auth-error-box');
        if (errBox) errBox.classList.add('hidden');
        try {
            await this.auth.loginAnonymous();
        } catch (error) {
            console.error('Guest login failed:', error);
            if (error.code === 'auth/unauthorized-domain' || (error.message && error.message.includes('unauthorized-domain'))) {
                this.ui.showAuthError(true);
            } else {
                this.ui.showAuthError(false);
            }
        }
    }

    handleAddNoteItem() {
        return this._noteHandler.handleAddNoteItem();
    }

    handleDeleteNoteItem(index) {
        return this._noteHandler.handleDeleteNoteItem(index);
    }

    handleSaveNotes() {
        return this._noteHandler.handleSaveNotes();
    }

    handleAddTrade() {
        return this._tradeActions.handleAddTrade();
    }

    handleDelete(id) {
        return this._tradeActions.handleDelete(id);
    }

    handleReset() {
        return this._tradeActions.handleReset();
    }

    handleExport() {
        return this._tradeActions.handleExport();
    }

    handleImport(e) {
        return this._tradeActions.handleImport(e);
    }

    calculateRisk(forceRecalc = false) {
        return this._riskCalc.calculateRisk(forceRecalc);
    }

    updateTHB() {
        return this._marketWidgets.updateTHB();
    }

    startMarketLoops() {
        return this._marketWidgets.startMarketLoops();
    }

    copyDomain() {
        return this._marketWidgets.copyDomain();
    }

    setQuickType(type) {
        return this._marketWidgets.setQuickType(type);
    }

    getSavedMarketSymbol() {
        return this._marketWidgets.getSavedMarketSymbol();
    }

    saveMarketSymbol(symbol) {
        return this._marketWidgets.saveMarketSymbol(symbol);
    }

    initTradingView(symbol) {
        return this._marketWidgets.initTradingView(symbol);
    }

    getSavedNewsCurrency() {
        return this._marketWidgets.getSavedNewsCurrency();
    }

    saveNewsCurrency(currency) {
        return this._marketWidgets.saveNewsCurrency(currency);
    }

    initEconomicCalendar(currency) {
        return this._marketWidgets.initEconomicCalendar(currency);
    }

    async initHealthTrack() {
        if (!this.auth.currentUser) return;
        
        const { default: SleepManager } = await import('./health/sleepManager.js');
        const { default: BodyManager } = await import('./health/bodyManager.js');
        const { default: DietManager } = await import('./health/dietManager.js');
        const { default: DataManager } = await import('./health/dataManager.js');
        const { default: TabManager } = await import('./health/tabManager.js');
        const { default: GlobalSaveManager } = await import('./health/globalSaveManager.js');

        const healthFirebaseAdapter = {
            subscribe: (collectionName, callback) => {
                return this.data.subscribeHealth(this.auth.currentUser.uid, collectionName, callback);
            },
            saveData: (collectionName, data) => {
                return this.data.saveHealth(this.auth.currentUser.uid, collectionName, data);
            },
            loadData: (collectionName) => {
                return this.data.loadHealth(this.auth.currentUser.uid, collectionName);
            }
        };

        this.healthTabManager = new TabManager();
        this.healthDietManager = new DietManager(healthFirebaseAdapter);
        this.healthBodyManager = new BodyManager(healthFirebaseAdapter, (newTarget) => {
            this.healthDietManager.setTarget(newTarget);
        });
        this.healthSleepManager = new SleepManager(healthFirebaseAdapter);
        this.healthDataManager = new DataManager(healthFirebaseAdapter);
        this.healthGlobalSaveManager = new GlobalSaveManager();

        this.healthInitialized = true;
    }
}