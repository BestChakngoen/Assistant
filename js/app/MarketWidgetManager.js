import { MARKET_ASSET_INTEL } from '../data/marketAssetIntel.js';

/**
 * MarketWidgetManager - Controls TradingView charts, Economic Calendar news feeds, and THB loops.
 */
export class MarketWidgetManager {
    constructor(app) {
        this.app = app;
        this._newsMessageListenerBound = false;
        window.toggleChartFullscreen = this.toggleFullscreen.bind(this);
    }

    toggleFullscreen() {
        const el = document.getElementById('tv-chart-wrapper');
        if (!el) return;
        if (!document.fullscreenElement) {
            if (el.requestFullscreen) {
                el.requestFullscreen();
            } else if (el.webkitRequestFullscreen) {
                el.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    async updateTHB() {
        try {
            const rate = await this.app.market.fetchTHB();
            if (rate) this.app.ui.updateTHB(rate);
        } catch (e) {
            console.warn('updateTHB error:', e);
        }
    }

    startMarketLoops() {
        this.updateTHB();
        setInterval(() => this.updateTHB(), 300000);
    }

    copyDomain() {
        const domEl = document.getElementById('domain-display');
        if (domEl) {
            const d = domEl.innerText;
            navigator.clipboard.writeText(d);
            alert("Copied: " + d);
        }
    }

    setQuickType(type) {
        const typeEl = document.getElementById('input-type');
        const amountEl = document.getElementById('input-amount');
        if (typeEl) typeEl.value = type;
        this.app.ui.toggleInputStyle();
        if (amountEl) amountEl.focus();
    }

    getSavedMarketSymbol() {
        const sym = localStorage.getItem('assistant_market_active_symbol') || 'BINANCE:BTCUSDT';
        if (sym === 'TVC:US10Y' || sym === 'CBOT:ZR1!') return 'BINANCE:BTCUSDT';
        return sym;
    }

    saveMarketSymbol(symbol) {
        if (symbol) {
            localStorage.setItem('assistant_market_active_symbol', symbol);
        }
    }

    initTradingView(symbol) {
        const activeSymbol = symbol || this.getSavedMarketSymbol();
        this.saveMarketSymbol(activeSymbol);
        this.renderAssetInfo(activeSymbol);

        const container = document.getElementById('tv-chart-container');
        if (!container) return;

        container.dataset.activeSymbol = activeSymbol;
        container.innerHTML = '';

        const createWidget = () => {
            if (typeof TradingView !== 'undefined') {
                new TradingView.widget({
                    "autosize": true,
                    "width": "100%",
                    "height": "100%",
                    "symbol": activeSymbol,
                    "interval": "D",
                    "timezone": "Asia/Bangkok",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "rgba(15, 23, 42, 1)",
                    "enable_publishing": false,
                    "hide_top_toolbar": false,
                    "hide_side_toolbar": true,
                    "allow_symbol_change": false,
                    "save_image": false,
                    "details": false,
                    "hotlist": false,
                    "calendar": false,
                    "show_popup_button": false,
                    "container_id": "tv-chart-container",
                    "backgroundColor": "rgba(15, 23, 42, 1)",
                    "withdateranges": false,
                    "hide_volume": true,
                    "disabled_features": ["create_volume_indicator_by_default"]
                });
            }
        };

        if (typeof TradingView !== 'undefined') {
            createWidget();
        } else {
            const sc = document.createElement('script');
            sc.src = 'https://s3.tradingview.com/tv.js';
            sc.async = true;
            sc.onload = createWidget;
            document.head.appendChild(sc);
        }
    }

    renderAssetInfo(symbol) {
        const activeSymbol = symbol || this.getSavedMarketSymbol();
        const infoContainer = document.getElementById('market-asset-info-card');
        if (!infoContainer) return;

        const asset = MARKET_ASSET_INTEL[activeSymbol] || {
            name: activeSymbol,
            category: 'Global Financial Asset',
            badgeClass: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
            iconText: 'AST',
            symbolName: activeSymbol,
            exchange: 'TradingView Market',
            whatIsIt: 'สินทรัพย์ทางการเงินในระบบตลาดโลก',
            tradingUnit: 'ราคา 1 หน่วยบนกราฟ = ตามมาตรฐานสัญญาของตลาดสากล',
            significance: 'ใช้สำหรับการติดตามความเคลื่อนไหวและบริหารความเสี่ยง',
            priceImpact: 'ผันผวนตามอุปสงค์-อุปทานและปัจจัยเศรษฐกิจมหภาค'
        };

        infoContainer.innerHTML = `
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-5">
                <div class="flex items-center gap-3.5">
                    <div class="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono text-sm shadow-[0_0_15px_rgba(6,182,212,0.15)] shrink-0">
                        ${asset.iconText}
                    </div>
                    <div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <h3 class="font-mono font-bold text-lg text-white">${asset.name}</h3>
                            <span class="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full ${asset.badgeClass}">${asset.category}</span>
                        </div>
                        <p class="text-xs text-slate-400 font-mono mt-0.5">${asset.symbolName} • ${asset.exchange}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <div class="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-800/80 w-fit">
                        <i data-lucide="book-open" class="w-3.5 h-3.5 text-cyan-400"></i>
                        <span class="text-[11px] font-bold text-cyan-400">ASSET INTEL & MACRO KNOWLEDGE</span>
                    </div>
                    <button onclick="document.getElementById('market-chart-section')?.scrollIntoView({ behavior: 'smooth' })" title="กลับขึ้นไปดูกราฟ" class="btn-press flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-cyan-400 bg-slate-950/40 hover:bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-slate-800/80 hover:border-cyan-500/30 transition-all">
                        <i data-lucide="arrow-up" class="w-3.5 h-3.5 text-cyan-400"></i>
                        <span class="hidden sm:inline text-[11px] font-bold">กลับขึ้นไปดูกราฟ</span>
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- 1. มันคืออะไร -->
                <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-2.5">
                            <span class="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                            <h4 class="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">1. มันคืออะไร</h4>
                        </div>
                        <p class="text-xs text-slate-300 leading-relaxed">${asset.whatIsIt}</p>
                    </div>
                </div>

                <!-- 2. มีหน่วยการขายอย่างไร -->
                <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-2.5">
                            <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
                            <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">2. ราคา 1 หน่วย ซื้อได้เท่าไหร่</h4>
                        </div>
                        <p class="text-xs text-slate-300 leading-relaxed">${asset.tradingUnit}</p>
                    </div>
                </div>

                <!-- 3. มีความสำคัญอย่างไร -->
                <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-2.5">
                            <span class="w-2 h-2 rounded-full bg-amber-400"></span>
                            <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">3. ความสำคัญต่อระบบโลก</h4>
                        </div>
                        <p class="text-xs text-slate-300 leading-relaxed">${asset.significance}</p>
                    </div>
                </div>

                <!-- 4. ราคาส่งผลกระทบอะไร -->
                <div class="p-4 rounded-xl bg-slate-950/60 border border-slate-800/60 flex flex-col justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-2.5">
                            <span class="w-2 h-2 rounded-full bg-pink-400"></span>
                            <h4 class="text-xs font-bold text-pink-400 uppercase tracking-wider font-mono">4. ราคาส่งผลกระทบอะไร</h4>
                        </div>
                        <p class="text-xs text-slate-300 leading-relaxed">${asset.priceImpact}</p>
                    </div>
                </div>
            </div>
        `;

        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    getSavedNewsCurrency() {
        return localStorage.getItem('assistant_news_currency_filter') || 'USD';
    }

    saveNewsCurrency(currency) {
        if (currency) {
            localStorage.setItem('assistant_news_currency_filter', currency);
        }
    }

    initEconomicCalendar(currency) {
        const activeCurrency = currency || this.getSavedNewsCurrency();
        this.saveNewsCurrency(activeCurrency);

        const container = document.getElementById('economic-calendar-container');
        if (!container) return;

        container.dataset.activeCurrency = activeCurrency;
        container.innerHTML = '<div class="tradingview-widget-container__widget w-full h-full"></div>';

        const widgetConfig = {
            "width": "100%",
            "height": "100%",
            "colorTheme": "dark",
            "isTransparent": true,
            "locale": "th_TH",
            "importanceFilter": "-1,0,1"
        };

        if (activeCurrency && activeCurrency !== 'ALL') {
            widgetConfig.currencyFilter = activeCurrency;
        }

        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
        script.async = true;
        script.type = "text/javascript";
        script.text = JSON.stringify(widgetConfig);
        container.appendChild(script);

        this.setupNewsWidgetMessageListener();
    }

    setupNewsWidgetMessageListener() {
        if (this._newsMessageListenerBound) return;
        this._newsMessageListenerBound = true;

        window.addEventListener('message', (event) => {
            if (!event.data) return;
            try {
                let payload = event.data;
                if (typeof payload === 'string') {
                    try { payload = JSON.parse(payload); } catch(e) {}
                }
                
                let foundCurrency = null;
                if (typeof payload === 'object' && payload !== null) {
                    if (payload.currencyFilter) foundCurrency = payload.currencyFilter;
                    else if (payload.currency) foundCurrency = payload.currency;
                    else if (Array.isArray(payload.currencies) && payload.currencies.length > 0) foundCurrency = payload.currencies.join(',');
                    else if (payload.name === 'tv-widget-events' && payload.data) {
                        if (payload.data.currencyFilter) foundCurrency = payload.data.currencyFilter;
                        else if (payload.data.currency) foundCurrency = payload.data.currency;
                    }
                }
                
                if (!foundCurrency && typeof event.data === 'string') {
                    const match = event.data.match(/"currencyFilter":\s*"([^"]+)"/) || event.data.match(/"currency":\s*"([^"]+)"/);
                    if (match) foundCurrency = match[1];
                }

                if (foundCurrency && typeof foundCurrency === 'string') {
                    this.saveNewsCurrency(foundCurrency);
                }
            } catch (err) {
                // Silent catch for cross-origin messages
            }
        });
    }
}
