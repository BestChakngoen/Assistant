import { AuthService } from './services/AuthService.js';
import { DataService } from './services/DataService.js';
import { MarketService } from './services/MarketService.js';
import { UIManager } from './ui/UIManager.js';

// --- FILE 5: MAIN APP CONTROLLER ---
export class TradeApp {
    constructor(userFirebaseConfig, appId = 'default-app-id') {
        this.auth = new AuthService(userFirebaseConfig);
        this.data = new DataService(this.auth.app, userFirebaseConfig, appId);
        this.market = new MarketService();
        this.ui = new UIManager();

        this.trades = [];
        this.notes = { title: '', items: [] }; // Local state for notes
        this.initListeners();
    }

    // Helper: Get current date as YYYY-MM-DD string in Thai Time (UTC+7)
    getThaiDateString() {
        return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
    }

    initListeners() {
        // Auth Events
        this.auth.onStateChange(async (user) => {
            if (user) {
                this.ui.showLogin(false);
                
                // UPDATED: Handle display name for Guest vs Google User
                const displayName = user.isAnonymous ? '// GUEST' : `// ${user.email}`;
                document.getElementById('user-display-name').innerText = displayName;
                const topUserDisplay = document.getElementById('top-user-display');
                if (topUserDisplay) topUserDisplay.innerText = displayName;
                
                // 1. Subscribe to Trades
                this.data.subscribeTrades(user.uid, (data, meta) => {
                    this.trades = data;
                    this.ui.renderTradeList(data, (id) => this.handleDelete(id));
                    this.ui.updateStats(data);
                    console.log('subscribeTrades meta:', meta);
                    if (meta) this.ui.updateCloudStats(meta);
                }, (err) => console.error(err));



                // 3. Subscribe to Strategy Diagram
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

                // 4. Initialize Health Track Managers
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


        // Risk Calculator Listeners
        ['risk-balance', 'risk-percent', 'risk-leverage', 'risk-asset', 'risk-entry', 'risk-sl', 'risk-tp', 'risk-rr-ratio', 'risk-spread'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.oninput = () => this.calculateRisk();
                el.onchange = () => this.calculateRisk();
            }
        });

        // Setup auto commas for text inputs (Balance, Entry, SL, TP)
        ['risk-balance', 'risk-entry', 'risk-sl', 'risk-tp'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('focus', () => {
                    // Strip commas when user clicks to edit
                    const cleanVal = el.value.replace(/,/g, '');
                    if (!isNaN(parseFloat(cleanVal)) && cleanVal !== '') {
                        el.value = cleanVal;
                    }
                });
                el.addEventListener('blur', () => {
                    // Add commas back when user clicks away
                    const cleanVal = el.value.replace(/,/g, '');
                    const val = parseFloat(cleanVal);
                    if (!isNaN(val) && cleanVal !== '') {
                        el.value = val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    }
                });
            }
        });

        // Auto leverage change when changing asset
        const assetSelect = document.getElementById('risk-asset');
        if (assetSelect) {
            assetSelect.addEventListener('change', () => {
                const levInput = document.getElementById('risk-leverage');
                if (levInput) {
                    if (assetSelect.value === 'BTC') {
                        levInput.value = '400';
                    } else {
                        levInput.value = '100';
                    }
                }
                this.calculateRisk();
            });
        }

        // เพิ่ม Listener สำหรับ Radio Buttons (Buy/Sell)
        document.querySelectorAll('input[name="risk-side"]').forEach(radio => {
            radio.onchange = () => this.calculateRisk();
        });



        // Button Clicks
        document.getElementById('btn-login').onclick = () => this.handleLogin();
        
        // NEW: Guest Login Button Listener
        const btnGuest = document.getElementById('btn-login-guest');
        if (btnGuest) btnGuest.onclick = () => this.handleLoginGuest();

        document.getElementById('btn-logout').onclick = () => this.auth.logout();
        document.getElementById('btn-copy-domain').onclick = () => this.copyDomain();
        document.getElementById('btn-add-trade').onclick = () => this.handleAddTrade();
        document.getElementById('btn-reset').onclick = () => this.handleReset();
        document.getElementById('btn-export').onclick = () => this.handleExport();
        document.getElementById('btn-import-trigger').onclick = () => document.getElementById('file-import').click();
        document.getElementById('file-import').onchange = (e) => this.handleImport(e);



        // Date Manual Reset Button (New Feature) - Adjusted for Thai Time
        document.getElementById('btn-set-today').onclick = () => {
            this.ui.dom.inputs.date.value = this.getThaiDateString();
        };

        // GitHub-style main menu tabs
        const bindTab = (id, target) => {
            const el = document.getElementById(id);
            if (el) {
                el.onclick = () => this.ui.switchTab(target);
            }
        };

        bindTab('tab-code', 'code');
        bindTab('tab-issues', 'issues');
        bindTab('tab-pulls', 'pulls');
        bindTab('tab-wiki', 'wiki');
        bindTab('tab-share', 'share');
        bindTab('tab-settings', 'settings');

        const tabActions = document.getElementById('tab-actions');
        if (tabActions) {
            tabActions.onclick = () => {
                this.ui.switchTab('actions');
                this.initTradingView('BINANCE:BTCUSDT');
            };
        }

        // Inputs
        document.getElementById('input-type').onchange = () => {
            this.ui.toggleInputStyle();
        };
        document.getElementById('input-asset').onchange = () => { this.ui.toggleInputStyle(); };

        // Quick Actions
        document.getElementById('btn-quick-deposit').onclick = () => this.setQuickType('DEPOSIT');
        document.getElementById('btn-quick-withdraw').onclick = () => this.setQuickType('WITHDRAW');

        // Market Assets Buttons
        const marketAssets = [
            { s: 'BINANCE:BTCUSDT', n: 'BTC/USDT', c: 'border-cyan-500 text-cyan-400' },
            { s: 'OANDA:XAUUSD', n: 'GOLD (XAU)', c: 'border-slate-600 text-slate-500' },
            { s: 'FX:EURUSD', n: 'EUR/USD', c: 'border-slate-600 text-slate-500' }
        ];
        const container = document.getElementById('market-assets-container');
        marketAssets.forEach(m => {
            const b = document.createElement('button');
            b.className = `asset-btn btn-press px-4 py-2 rounded-lg font-mono text-sm border hover:border-cyan-500 transition-all ${m.c}`;
            b.innerText = m.n;
            b.onclick = () => {
                document.querySelectorAll('.asset-btn').forEach(x => {
                    x.classList.remove('border-cyan-500', 'text-cyan-400');
                    x.classList.add('border-slate-600', 'text-slate-500');
                });
                b.classList.remove('border-slate-600', 'text-slate-500');
                b.classList.add('border-cyan-500', 'text-cyan-400');
                this.initTradingView(m.s);
            };
            container.appendChild(b);
        });

        // Initial UI - Adjusted for Thai Time
        document.getElementById('input-date').value = this.getThaiDateString();
        this.updateTHB();
    }

    // --- Handlers ---

    async handleLogin() {
        const status = document.getElementById('login-status');
        status.innerText = "Contacting Identity Provider...";
        document.getElementById('auth-error-box').classList.add('hidden');
        try {
            await this.auth.login();
        } catch (error) {
            if (error.code === 'auth/unauthorized-domain' || error.message.includes('unauthorized-domain')) {
                this.ui.showAuthError(true);
            } else {
                this.ui.showAuthError(false);
            }
        }
    }

    // NEW: Guest Login Handler
    async handleLoginGuest() {
        const status = document.getElementById('login-status');
        status.innerText = "Entering as Guest...";
        document.getElementById('auth-error-box').classList.add('hidden');
        try {
            await this.auth.loginAnonymous();
        } catch (error) {
            console.error('Guest login failed:', error);
            if (error.code === 'auth/unauthorized-domain' || error.message.includes('unauthorized-domain')) {
                this.ui.showAuthError(true);
            } else {
                this.ui.showAuthError(false);
            }
        }
    }

    // --- NEW: NOTE HANDLERS ---
    handleAddNoteItem() {
        const input = document.getElementById('note-input');
        const text = input.value.trim();
        if(!text) return;
        
        if(!this.notes.items) this.notes.items = [];
        this.notes.items.push(text);
        
        // Optimistic UI Update
        this.ui.renderNotes(this.notes, (i) => this.handleDeleteNoteItem(i));
        input.value = '';
        input.focus();
    }

    handleDeleteNoteItem(index) {
        if(!this.notes.items) return;
        this.notes.items.splice(index, 1);
        this.ui.renderNotes(this.notes, (i) => this.handleDeleteNoteItem(i));
    }

    async handleSaveNotes() {
        if (!this.auth.currentUser) return;
        const btn = document.getElementById('btn-save-note');
        const originalText = btn.innerHTML;
        
        btn.innerText = 'SAVING...';
        btn.disabled = true;

        // Get current title from input
        this.notes.title = document.getElementById('note-title').value;

        try {
            await this.data.saveNotes(this.auth.currentUser.uid, this.notes);
            btn.innerText = 'SAVED!';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1500);
        } catch(e) {
            console.error(e);
            btn.innerText = 'ERROR';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 1500);
        }
    }

    async handleAddTrade() {
        if (!this.auth.currentUser) return;
        const dom = this.ui.dom.inputs;
        const date = dom.date.value;
        const asset = dom.asset.disabled ? 'CASH' : dom.asset.value;
        const type = dom.type.value;
        let amount = parseFloat(dom.amount.value);

        if (!date || isNaN(amount)) { alert("Check inputs"); return; }

        amount = Math.abs(amount);
        if (type === 'LOSS' || type === 'WITHDRAW') amount = -amount;

        const ts = Date.now();
        const trade = {
            id: ts,
            order_index: ts, // ADDED: Index for sorting consistency
            date, asset, type, amount,
            timestamp: new Date().toISOString()
        };

        await this.data.addTrade(this.auth.currentUser.uid, trade);
        dom.amount.value = '';
        
        // Auto-Update Date to Today (Thai Time) after successful record
        dom.date.value = this.getThaiDateString(); 
    }

    async handleDelete(id) {
        if (confirm('Delete record?')) {
            // find trade object to allow meta update
            const trade = this.trades.find(t => t.firestoreId === id);
            await this.data.deleteTrade(this.auth.currentUser.uid, id, trade);
        }
    }

    async handleReset() {
        if (confirm('Wipe ALL data?')) {
            await this.data.resetAll(this.auth.currentUser.uid, this.trades);
        }
    }

    handleExport() {
        if (this.trades.length === 0) return;
        let csv = "Date,Asset,Type,Amount\n" + this.trades.map(t => `${t.date},${t.asset},${t.type},${t.amount}`).join('\n');
        const link = document.createElement("a");
        link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
        link.download = "trades.csv";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    }

    handleImport(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            const items = this.data.parseCSV(event.target.result);
            if (items && confirm(`Import ${items.length} items?`)) {
                for (const item of items) {
                    await this.data.addTrade(this.auth.currentUser.uid, item);
                }
                alert("Import Complete");
                e.target.value = '';
            }
        };
        reader.readAsText(file);
    }
    // --- Calculator Logic ---
    calculateRisk() {
        const dom = {
            bal: document.getElementById('risk-balance'),
            pct: document.getElementById('risk-percent'),
            lev: document.getElementById('risk-leverage'),
            asset: document.getElementById('risk-asset'),
            entry: parseFloat(document.getElementById('risk-entry').value.replace(/,/g, '')) || 0,
            slInput: document.getElementById('risk-sl'),
            tpInput: document.getElementById('risk-tp'),
            rrRatio: parseFloat(document.getElementById('risk-rr-ratio').value) || 2,
            side: document.querySelector('input[name="risk-side"]:checked').value, // รับค่า LONG หรือ SHORT
            // Outputs
            oLot: document.getElementById('res-lot'),
            oMargin: document.getElementById('res-margin'),
            oRisk: document.getElementById('res-risk-amt'),
            oReward: document.getElementById('res-reward-amt'),
            oRR: document.getElementById('res-rr'),
            oEval: document.getElementById('res-rr-eval')
        };

        let rawSl = parseFloat(dom.slInput.value.replace(/,/g, ''));
        let rawTp = parseFloat(dom.tpInput.value.replace(/,/g, ''));

        // Automatic SL / TP calculation if entry exists
        if (dom.entry > 0) {
            // Find default tick sizes / distances based on asset
            const assetSelect = document.getElementById('risk-asset');
            const assetName = assetSelect ? assetSelect.value : 'BTC';
            
            // Default SL distance: BTC = 200$, XAU = 5$, EUR = 0.0020
            let defaultDistSL = 200;
            if (assetName === 'XAU') defaultDistSL = 5;
            else if (assetName === 'EUR') defaultDistSL = 0.0020;

            const isLong = (dom.side === 'LONG');

            // Force recalculate SL/TP if Entry input is the active element (being actively typed/changed)
            const entryInputActive = (document.activeElement && document.activeElement.id === 'risk-entry');
            const rrInputActive = (document.activeElement && document.activeElement.id === 'risk-rr-ratio');

            // If SL is not set, violates direction rules, or Entry input is being changed: recalculate SL
            const slIsInvalidDirection = isLong ? (rawSl >= dom.entry) : (rawSl <= dom.entry && rawSl > 0);
            if (isNaN(rawSl) || rawSl === 0 || slIsInvalidDirection || entryInputActive) {
                if (isLong) {
                    rawSl = dom.entry - defaultDistSL;
                } else {
                    rawSl = dom.entry + defaultDistSL;
                }
                dom.slInput.value = rawSl.toLocaleString('en-US', { minimumFractionDigits: assetName === 'EUR' ? 4 : 2, maximumFractionDigits: assetName === 'EUR' ? 4 : 2 });
            }

            // If TP is not set, violates direction rules, Entry is being changed, or R:R Ratio input is active: recalculate TP based on R:R
            const slDistance = Math.abs(dom.entry - rawSl);
            const tpDistance = slDistance * dom.rrRatio;
            const tpIsInvalidDirection = isLong ? (rawTp <= dom.entry) : (rawTp >= dom.entry && rawTp > 0);

            if (isNaN(rawTp) || rawTp === 0 || tpIsInvalidDirection || entryInputActive || rrInputActive) {
                if (isLong) {
                    rawTp = dom.entry + tpDistance;
                } else {
                    rawTp = dom.entry - tpDistance;
                }
                dom.tpInput.value = rawTp.toLocaleString('en-US', { minimumFractionDigits: assetName === 'EUR' ? 4 : 2, maximumFractionDigits: assetName === 'EUR' ? 4 : 2 });
            }
        }

        const sl = rawSl || 0;
        const tp = rawTp || 0;

        // 1. Get Balance
        let balance = parseFloat(dom.bal.value.replace(/,/g, ''));
        if (isNaN(balance) || balance === 0) {
            const currentBalText = document.getElementById('summary-balance').innerText;
            balance = parseFloat(currentBalText.replace(/,/g, '')) || 0;
            if (balance === 0) balance = 1000;
            dom.bal.placeholder = balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " (Auto)";
        } else {
            dom.bal.placeholder = "Auto";
        }

        // 2. Calculate Risk Amount ($)
        const riskPct = parseFloat(dom.pct.value) || 2;
        const riskAmt = balance * (riskPct / 100);

        // 3. Asset Config
        const contractSize = parseFloat(dom.asset.options[dom.asset.selectedIndex].dataset.size) || 1;

        // 4. Logic & Validation based on Direction
        let isValidSetup = true;
        let setupError = "";

        // ตรวจสอบเงื่อนไขราคาตามทิศทาง
        if (dom.entry > 0 && sl > 0) {
            if (dom.side === 'LONG') {
                if (sl >= dom.entry) {
                    isValidSetup = false;
                    setupError = "Invalid Long: SL ≥ Entry";
                }
            } else { // SHORT
                if (sl <= dom.entry) {
                    isValidSetup = false;
                    setupError = "Invalid Short: SL ≤ Entry";
                }
            }
        }

        // คำนวณระยะห่างทางราคาจริง (Price Distance)
        const rawDistSL = Math.abs(dom.entry - sl);
        const rawDistTP = Math.abs(tp - dom.entry);

        // ค่า Spread ที่ป้อนเข้ามาคือ Spread Cost ($) ต่อ 0.01 Lot
        const spreadPer01 = parseFloat(document.getElementById('risk-spread').value) || 0;

        let lots = 0;
        let rewardAmt = 0;
        let margin = 0;
        let rr = 0;
        let actualRiskAmt = 0;

        if (dom.entry > 0 && rawDistSL > 0 && isValidSetup) {
            // เพื่อจำกัดความเสี่ยงรวม (ผลขาดทุนจากจุด SL + ค่า Spread) ไม่ให้เกิน Risk Amount ($)
            // สูตร: Lots = RiskAmt / (PriceDistanceSL * ContractSize + SpreadPer0.01 * 100)
            lots = riskAmt / ((rawDistSL * contractSize) + (spreadPer01 * 100));

            // คำนวณค่าธรรมเนียม Spread ทั้งหมด: Total Spread Cost ($) = (Lots / 0.01) * SpreadPer0.01
            const totalSpreadCost = (lots / 0.01) * spreadPer01;

            // มูลค่าขาดทุนจริงรวมค่า Spread เมื่อชน SL
            actualRiskAmt = (lots * rawDistSL * contractSize) + totalSpreadCost;

            // มูลค่ากำไรจริงสุทธิเมื่อชน TP (หักลบค่า Spread ออก)
            rewardAmt = Math.max(0, (lots * rawDistTP * contractSize) - totalSpreadCost);

            // Calculate Margin
            const leverage = parseFloat(dom.lev.value) || 100;
            margin = (lots * contractSize * dom.entry) / leverage;

            // อัตราส่วน R:R จริงหลังหักค่าธรรมเนียม Spread สุทธิ
            rr = actualRiskAmt > 0 ? (rewardAmt / actualRiskAmt) : 0;
        }

        // นำระยะจริงไปแสดงผลที่ป้ายบอกระยะทางราคา (Pts)
        const distSL = rawDistSL;
        const distTP = rawDistTP;

        // 5. Update UI
        if (!isValidSetup && dom.entry > 0 && sl > 0) {
            // กรณี Setup ผิดพลาด
            dom.oLot.innerText = "ERROR";
            dom.oLot.classList.add('text-red-500');
            dom.oLot.classList.remove('text-white');

            if (dom.oEval) {
                dom.oEval.innerText = setupError;
                dom.oEval.className = "text-[10px] text-red-500 mt-1 font-bold animate-pulse";
            }

            dom.oRisk.innerText = "$0.00";
            dom.oReward.innerText = "$0.00";
            dom.oMargin.innerText = "$0.00";
            if (dom.oRR) dom.oRR.innerText = "- : -";
        } else {
            // กรณีปกติ
            dom.oLot.classList.remove('text-red-500');
            dom.oLot.classList.add('text-white');
            dom.oLot.innerText = lots > 0 ? lots.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

            dom.oRisk.innerText = "$" + actualRiskAmt.toLocaleString('en-US', { minimumFractionDigits: 2 });
            dom.oReward.innerText = "$" + rewardAmt.toLocaleString('en-US', { minimumFractionDigits: 2 });
            dom.oMargin.innerText = "$" + margin.toLocaleString('en-US', { minimumFractionDigits: 2 });

            if (dom.entry > 0 && sl > 0 && tp > 0) {
                if (dom.oRR) {
                    dom.oRR.innerText = `1 : ${rr.toFixed(2)}`;
                    if (rr < 1) {
                        dom.oRR.className = "text-sm font-mono font-bold text-red-400";
                    } else if (rr < 2) {
                        dom.oRR.className = "text-sm font-mono font-bold text-yellow-400";
                    } else {
                        dom.oRR.className = "text-sm font-mono font-bold text-green-400";
                    }
                }

                if (dom.oEval) {
                    if (rr < 1) {
                        dom.oEval.innerText = "Poor Risk/Reward";
                        dom.oEval.className = "text-[10px] text-red-500 mt-1";
                    } else if (rr < 2) {
                        dom.oEval.innerText = "Moderate";
                        dom.oEval.className = "text-[10px] text-yellow-500 mt-1";
                    } else {
                        dom.oEval.innerText = "Excellent Setup!";
                        dom.oEval.className = "text-[10px] text-green-500 mt-1";
                    }
                }
            } else {
                if (dom.oRR) {
                    dom.oRR.innerText = "0 : 0";
                    dom.oRR.className = "text-sm font-mono font-bold text-slate-500";
                }
                if (dom.oEval) {
                    dom.oEval.innerText = "Waiting for inputs...";
                    dom.oEval.className = "text-[10px] text-slate-600 mt-1";
                }
            }

            // Real-time update of SL/TP distances
            const distSlEl = document.getElementById('dist-sl-val');
            const distTpEl = document.getElementById('dist-tp-val');
            const assetSelect = document.getElementById('risk-asset');
            const assetName = assetSelect ? assetSelect.value : 'BTC';
            const decimals = assetName === 'EUR' ? 4 : 2;

            if (distSlEl) {
                distSlEl.innerText = distSL > 0 ? distSL.toFixed(decimals) + " pts" : "-";
            }
            if (distTpEl) {
                distTpEl.innerText = distTP > 0 ? distTP.toFixed(decimals) + " pts" : "-";
            }
        }
    }
    // --- Market & Helpers ---

    // Live price removed: no updatePrice method

    async updateTHB() {
        try {
            const rate = await this.market.fetchTHB();
            if (rate) this.ui.updateTHB(rate);
        } catch (e) {
            console.warn('updateTHB error:', e);
        }
    }

    startMarketLoops() {
        // Fetch THB rate every 5 minutes instead of 15 seconds to avoid rate limiting
        this.updateTHB(); // Initial fetch
        setInterval(() => this.updateTHB(), 300000);
    }

    copyDomain() {
        const d = document.getElementById('domain-display').innerText;
        navigator.clipboard.writeText(d);
        alert("Copied: " + d);
    }

    setQuickType(type) {
        document.getElementById('input-type').value = type;
        this.ui.toggleInputStyle();
        document.getElementById('input-amount').focus();
    }

    initTradingView(symbol) {
        document.getElementById('tv-chart-container').innerHTML = '';
        const sc = document.createElement('script');
        sc.src = 'https://s3.tradingview.com/tv.js';
        sc.async = true;
        sc.onload = () => {
            new TradingView.widget({
                "width": "100%", "height": "100%", "symbol": symbol, "interval": "D", "timezone": "Asia/Bangkok", "theme": "dark", "style": "1", "locale": "en", "toolbar_bg": "#f1f3f6", "enable_publishing": false, "container_id": "tv-chart-container", "backgroundColor": "rgba(15, 23, 42, 1)"
            });
        };
        document.head.appendChild(sc);
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