/**
 * MarketWidgetManager - Controls TradingView charts, Economic Calendar news feeds, and THB loops.
 */
export class MarketWidgetManager {
    constructor(app) {
        this.app = app;
        this._newsMessageListenerBound = false;
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
        return localStorage.getItem('assistant_market_active_symbol') || 'BINANCE:BTCUSDT';
    }

    saveMarketSymbol(symbol) {
        if (symbol) {
            localStorage.setItem('assistant_market_active_symbol', symbol);
        }
    }

    initTradingView(symbol) {
        const activeSymbol = symbol || this.getSavedMarketSymbol();
        this.saveMarketSymbol(activeSymbol);

        const container = document.getElementById('tv-chart-container');
        if (!container) return;

        container.dataset.activeSymbol = activeSymbol;
        container.innerHTML = '';

        const createWidget = () => {
            if (typeof TradingView !== 'undefined') {
                new TradingView.widget({
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
                    "withdateranges": false
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
