import { AuthService } from './services/AuthService.js';
import { DataService } from './services/DataService.js';
import { MarketService } from './services/MarketService.js';
import { UIManager } from './ui/UIManager.js';
import { RiskCalculator } from './trade/RiskCalculator.js';
import { NoteHandler } from './trade/NoteHandler.js';
import { TradeActionsHandler } from './trade/TradeActionsHandler.js';
import { MarketWidgetManager } from './market/MarketWidgetManager.js';
import { NetWorthManager } from './networth/NetWorthManager.js';
import { SystemSettingsManager } from './settings/SystemSettingsManager.js';
import { TradeDisciplineManager } from './trade/TradeDisciplineManager.js';
import { NotificationManager } from './notifications/NotificationManager.js';
import { UIUtils } from './ui/UIUtils.js';

/**
 * TradeApp - Main Application Facade Coordinator
 * Coordinates Auth, Data, UI, Risk Management, Notes, Trade Actions, and Market Widgets.
 */
export class TradeApp {
    constructor(userFirebaseConfig, appId = 'default-app-id') {
        window.app = this;
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
        this.notifications = new NotificationManager(this);
        this.notifications.init();
        window.notificationManager = this.notifications;

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
                // Sync Hydration Flags
                let isDiagramHydrated = false;
                let isNoteHydrated = false;
                let isTableHydrated = false;
                let isNotificationsHydrated = false;

                // Subscribe to Diagram
                if (this.ui.diagram) {
                    this.data.subscribeDiagram(user.uid, (shapes) => {
                        isDiagramHydrated = true;
                        if (shapes && shapes.length > 0) {
                            this.ui.diagram.shapes = shapes;
                            this.ui.diagram.draw();
                        } else if (this.ui.diagram.shapes.length > 0) {
                            this.data.saveDiagram(user.uid, this.ui.diagram.shapes).catch(err => console.error("Firestore diagram seed error:", err));
                        }
                    });

                    this.ui.diagram.onSaveCallback = (shapes) => {
                        if (!isDiagramHydrated) return; // Layer 1: Hydration Lock
                        
                        const isCleared = this.ui.diagram.isExplicitlyCleared;
                        this.ui.diagram.isExplicitlyCleared = false; // Reset immediately

                        if (!shapes || (shapes.length === 0 && !isCleared)) return; // Layer 2: Content Guard
                        this.data.saveDiagram(user.uid, shapes).catch(err => console.error("Firestore diagram save error:", err));
                    };
                }

                // Subscribe to Quick Note & Scratchpad
                if (this.ui.tools && this.ui.tools.notePadTool) {
                    const noteTool = this.ui.tools.notePadTool;
                    
                    const hasRealNoteContent = (data) => {
                        if (!data) return false;
                        if (data.isExplicitlyCleared) return true;
                        const content = typeof data.content === 'string' ? data.content.trim() : '';
                        const title = typeof data.title === 'string' ? data.title.trim() : '';
                        const hasSheets = Array.isArray(data.sheets) && data.sheets.some(s => s.title?.trim() || (typeof s.content === 'string' && s.content.trim() !== '') || (Array.isArray(s.stickers) && s.stickers.length > 0));
                        const hasFolders = Array.isArray(data.folders) && data.folders.length > 0;
                        return content !== '' || title !== '' || hasSheets || hasFolders;
                    };

                    noteTool.onSave = (data) => {
                        if (!isNoteHydrated) return; // Layer 1: Hydration Lock
                        if (!hasRealNoteContent(data)) return; // Layer 2: Content Guard
                        this.data.saveQuickNote(user.uid, data).catch(err => console.error("Firestore quickNote save error:", err));
                    };
                    const fetchNote = async () => {
                        const btn = document.getElementById('btn-note-refresh');
                        if (btn) btn.innerHTML = `<i data-lucide="loader-2" class="size-3.5 animate-spin"></i><span class="hidden md:inline">Syncing</span>`;
                        if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
                        
                        if (typeof noteTool.setSyncingState === 'function') noteTool.setSyncingState(true);
                        const cloudData = await this.data.fetchQuickNote(user.uid);
                        isNoteHydrated = true;
                        if (cloudData) noteTool.syncFromCloud(cloudData);
                        else noteTool.syncFromCloud(null);
                        if (typeof noteTool.setSyncingState === 'function') noteTool.setSyncingState(false);
                        
                        if (btn) btn.innerHTML = `<i data-lucide="refresh-cw" class="size-3.5"></i><span class="hidden md:inline">Sync</span>`;
                        if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
                    };

                    const btnNoteRefresh = document.getElementById('btn-note-refresh');
                    if (btnNoteRefresh) btnNoteRefresh.addEventListener('click', fetchNote);
                    
                    // Initial load
                    fetchNote();
                }

                // Subscribe to Quick Table Grid
                if (this.ui.tools && this.ui.tools.tableGridTool) {
                    const tableTool = this.ui.tools.tableGridTool;
                    
                    const hasRealTableContent = (data) => {
                        if (!data) return false;
                        if (data.isExplicitlyCleared) return true;
                        const title = typeof data.title === 'string' ? data.title.trim() : '';
                        const hasRows = data.rows && data.rows.some(r => Array.isArray(r) && r.some(c => c && c.trim() !== ''));
                        const hasSheets = Array.isArray(data.sheets) && data.sheets.some(s => s.title?.trim() || (s.rows && s.rows.some(r => Array.isArray(r) && r.some(c => c && c.trim() !== ''))));
                        return title !== '' || hasRows || hasSheets;
                    };

                    tableTool.onSave = (data) => {
                        if (!isTableHydrated) return; // Layer 1: Hydration Lock
                        if (!hasRealTableContent(data)) return; // Layer 2: Content Guard
                        this.data.saveQuickTable(user.uid, data).catch(err => console.error("Firestore quickTable save error:", err));
                    };
                    const fetchTable = async () => {
                        const btn = document.getElementById('btn-table-refresh');
                        if (btn) btn.innerHTML = `<i data-lucide="loader-2" class="size-3.5 animate-spin"></i><span class="hidden md:inline">Syncing</span>`;
                        if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
                        
                        if (typeof tableTool.setSyncingState === 'function') tableTool.setSyncingState(true);
                        const cloudData = await this.data.fetchQuickTable(user.uid);
                        isTableHydrated = true;
                        if (cloudData) tableTool.syncFromCloud(cloudData);
                        else tableTool.syncFromCloud(null);
                        if (typeof tableTool.setSyncingState === 'function') tableTool.setSyncingState(false);
                        
                        if (btn) btn.innerHTML = `<i data-lucide="refresh-cw" class="size-3.5"></i><span class="hidden md:inline">Sync</span>`;
                        if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
                    };

                    const btnTableRefresh = document.getElementById('btn-table-refresh');
                    if (btnTableRefresh) btnTableRefresh.addEventListener('click', fetchTable);
                    
                    // Initial load
                    fetchTable();
                }

                // Subscribe to Notifications & Reminders
                if (this.notifications) {
                    const hasRealNotificationContent = (data) => {
                        if (!data) return false;
                        if (data.isExplicitlyCleared) return true;
                        const hasReminders = Array.isArray(data.reminders) && data.reminders.length > 0;
                        const hasHistory = Array.isArray(data.history) && data.history.length > 0;
                        return hasReminders || hasHistory;
                    };

                    this.notifications.onSave = (data) => {
                        if (!isNotificationsHydrated) return; // Layer 1: Hydration Lock
                        if (!hasRealNotificationContent(data)) return; // Layer 2: Content Guard
                        this.data.saveNotifications(user.uid, data).catch(err => console.error("Firestore notifications save error:", err));
                    };
                    if (typeof this.notifications.setSyncingState === 'function') {
                        this.notifications.setSyncingState(true);
                    }
                    this.data.subscribeNotifications(user.uid, (cloudData) => {
                        isNotificationsHydrated = true;
                        this.notifications.syncFromCloud(cloudData);
                        if (typeof this.notifications.setSyncingState === 'function') {
                            this.notifications.setSyncingState(false);
                        }
                    });
                }

                // Initialize Health Track Managers
                if (!this.healthInitialized) {
                    await this.initHealthTrack();
                }

                this.startMarketLoops();
            } else {
                this.ui.showLogin(true);
                if (this._netWorth) {
                    this._netWorth.initSupabaseSync();
                }
                if (this.ui.diagram) {
                    this.ui.diagram.onSaveCallback = null;
                }
                if (this.data.unsubscribeDiagram) {
                    this.data.unsubscribeDiagram();
                }
                if (this.ui.tools && this.ui.tools.notePadTool) {
                    this.ui.tools.notePadTool.onSave = null;
                }
                if (this.data.unsubscribeQuickNote) {
                    this.data.unsubscribeQuickNote();
                }
                if (this.ui.tools && this.ui.tools.tableGridTool) {
                    this.ui.tools.tableGridTool.onSave = null;
                }
                if (this.data.unsubscribeQuickTable) {
                    this.data.unsubscribeQuickTable();
                }
                if (this.notifications) {
                    this.notifications.onSave = null;
                }
                if (this.data.unsubscribeNotifications) {
                    this.data.unsubscribeNotifications();
                }
            }
        });

        // Delegate Risk Calculator Listeners
        this._riskCalc.initListeners();

        // Centralized Auto-hiding Scrollbar Listener (Global Capture)
        window.addEventListener('scroll', (e) => {
            const target = e.target;
            if (!target || !target.classList) return;
            const scrollContainer = target.classList.contains('auto-hide-scrollbar')
                ? target
                : (target.closest ? target.closest('.auto-hide-scrollbar') : null);

            if (scrollContainer) {
                scrollContainer.classList.add('is-scrolling');
                clearTimeout(scrollContainer._scrollTimeout);
                scrollContainer._scrollTimeout = setTimeout(() => {
                    scrollContainer.classList.remove('is-scrolling');
                }, 800);
            }
        }, { capture: true, passive: true });

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

        const tabCode = document.getElementById('tab-trade');
        if (tabCode) {
            tabCode.onclick = () => {
                this.ui.switchTab('trade');
                if (this._disciplineManager) this._disciplineManager.updateUI(this.trades);
            };
        }
        bindTab('tab-strategy', 'strategy');
        bindTab('tab-health', 'health');
        bindTab('tab-air', 'air');

        const tabWiki = document.getElementById('tab-news');
        if (tabWiki) {
            tabWiki.onclick = () => {
                this.ui.switchTab('news');
                const savedCurrency = this.getSavedNewsCurrency();
                const container = document.getElementById('economic-calendar-container');
                if (container && (!container.children.length || container.dataset.activeCurrency !== savedCurrency)) {
                    this.initEconomicCalendar(savedCurrency);
                }
            };
        }

        bindTab('tab-share', 'share');
        bindTab('tab-tools', 'tools');

        const tabNotifications = document.getElementById('tab-notifications');
        if (tabNotifications) {
            tabNotifications.onclick = () => {
                this.ui.switchTab('notifications');
                if (this.notifications) this.notifications.render();
            };
        }

        const btnHeaderNotifications = document.getElementById('btn-header-notifications');
        if (btnHeaderNotifications) {
            btnHeaderNotifications.onclick = (e) => {
                if (e) e.preventDefault();
                this.ui.switchTab('notifications');
                if (this.notifications) this.notifications.render();
            };
        }
        
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

        const tabActions = document.getElementById('tab-market');
        if (tabActions) {
            tabActions.onclick = () => {
                this.ui.switchTab('market');
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
                b.className = `asset-btn btn-press shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg font-mono text-xs transition-all ${
                    isSelected ? 'bg-cyan-500/20 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-900/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`;
                b.innerText = m.n;
                b.onclick = () => {
                    document.querySelectorAll('.asset-btn').forEach(x => {
                        x.classList.remove('bg-cyan-500/20', 'text-cyan-300', 'font-bold', 'shadow-[0_0_10px_rgba(6,182,212,0.2)]');
                        x.classList.add('bg-slate-900/40', 'text-slate-400');
                    });
                    b.classList.remove('bg-slate-900/40', 'text-slate-400');
                    b.classList.add('bg-cyan-500/20', 'text-cyan-300', 'font-bold', 'shadow-[0_0_10px_rgba(6,182,212,0.2)]');
                    this.saveMarketSymbol(m.s);
                    this.initTradingView(m.s);
                };
                container.appendChild(b);
            });

            // Setup universal horizontal slide bar (Wheel scroll + Auto-hide)
            UIUtils.setupCustomSlideBar(container);
        }

        // Initial UI Date & Market Rates
        const inputDate = document.getElementById('input-date');
        if (inputDate) inputDate.value = this.getThaiDateString();
        this.updateTHB();
    }

    /**
     * Initializes universal horizontal slide bars (.custom-slide-bar)
     * Handles horizontal mouse wheel scrolling, click-and-drag scrolling, and auto-hiding scrollbar
     */
    setupCustomSlideBar(element) {
        if (!element || element.dataset.hasSlideBarInit) return;
        element.dataset.hasSlideBarInit = 'true';

        // Mouse Wheel Horizontal Scroll
        element.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                element.scrollLeft += e.deltaY;
            }
        }, { passive: false });

        // Auto-hiding Scrollbar Indicator
        let scrollTimer;
        element.addEventListener('scroll', () => {
            element.classList.add('is-scrolling');
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                element.classList.remove('is-scrolling');
            }, 800);
        }, { passive: true });

        // Click-and-Drag Horizontal Scrolling (Mouse Drag)
        let isDown = false;
        let startX = 0;
        let scrollStart = 0;
        let hasMoved = false;

        const onMouseMove = (e) => {
            if (!isDown) return;
            const walk = e.clientX - startX;

            if (Math.abs(walk) > 5) {
                hasMoved = true;
                e.preventDefault();
                element.scrollLeft = scrollStart - walk;
            }
        };

        const onMouseUp = () => {
            if (!isDown) return;
            isDown = false;

            element.style.scrollBehavior = '';
            element.classList.remove('is-dragging');

            window.removeEventListener('mousemove', onMouseMove);

            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                element.classList.remove('is-scrolling');
            }, 800);

            // Prevent accidental button clicks when dragging
            if (hasMoved) {
                const captureClick = (e) => {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                };
                element.addEventListener('click', captureClick, { capture: true, once: true });
            }
        };

        const onMouseDown = (e) => {
            // Only handle primary (left) mouse button
            if (e.button !== 0) return;
            isDown = true;
            hasMoved = false;
            startX = e.clientX;
            scrollStart = element.scrollLeft;

            // Disable smooth scrolling temporarily for 1:1 crisp responsiveness
            element.style.scrollBehavior = 'auto';
            element.classList.add('is-dragging', 'is-scrolling');

            window.addEventListener('mousemove', onMouseMove, { passive: false });
            window.addEventListener('mouseup', onMouseUp, { once: true });
        };

        element.addEventListener('mousedown', onMouseDown);
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
        
        const { default: SleepManager } = await import('./health/sleep/sleepManager.js');
        const { default: BodyManager } = await import('./health/body/bodyManager.js');
        const { default: DietManager } = await import('./health/diet/dietManager.js');
        const { default: DataManager } = await import('./health/dataManager.js');
        const { default: TabManager } = await import('./health/tabManager.js');
        const { default: GlobalSaveManager } = await import('./health/globalSaveManager.js');
        const { default: DetoxManager } = await import('./health/detox/detoxManager.js');

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
        this.healthDetoxManager = new DetoxManager(healthFirebaseAdapter);
        this.healthGlobalSaveManager = new GlobalSaveManager();

        this.healthInitialized = true;
    }
}
