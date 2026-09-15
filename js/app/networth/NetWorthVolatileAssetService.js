import { API_ENDPOINTS, API_TIMEOUTS } from '../../config/apiConfig.js';
import { HttpClient } from '../../services/api/HttpClient.js';

/**
 * NetWorthVolatileAssetService.js - Market Pricing & PnL Engine for Volatile Assets
 * Handles:
 * 1. Live market price fetching (Binance, CoinGecko, and currency conversions).
 * 2. Position math: invested cost, current valuation, unrealized P/L ($/฿ and %).
 * 3. Batch refreshing of volatile assets in portfolio.
 */
export class NetWorthVolatileAssetService {
    /**
     * Map of common crypto tickers to CoinGecko IDs as fallback
     */
    static COINGECKO_MAP = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'BNB': 'binancecoin',
        'XRP': 'ripple',
        'DOGE': 'dogecoin',
        'ADA': 'cardano',
        'AVAX': 'avalanche-2',
        'LINK': 'chainlink',
        'DOT': 'polkadot',
        'SUI': 'sui',
        'NEAR': 'near',
        'PEPE': 'pepe',
        'SHIB': 'shiba-inu',
        'PAXG': 'pax-gold',
        'XAU': 'pax-gold'
    };

    /**
     * Set of common cryptocurrency ticker symbols
     */
    static KNOWN_CRYPTO = new Set([
        'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA', 'AVAX', 'LINK', 'DOT',
        'SUI', 'NEAR', 'PEPE', 'SHIB', 'PAXG', 'XAU', 'TON', 'TRX', 'LTC', 'BCH',
        'UNI', 'APT', 'RENDER', 'ICP', 'FET', 'TAO', 'AAVE', 'ATOM', 'XMR', 'ETC',
        'FIL', 'ARB', 'OP', 'MKR', 'INJ', 'MATIC', 'POL', 'KAS', 'TIA', 'STX',
        'IMX', 'HBAR', 'ALGO', 'FTM', 'SAND', 'MANA', 'AXS', 'THETA', 'USDT', 'USDC'
    ]);

    /**
     * Curated catalogue of popular US ETFs, Stocks, and Cryptocurrencies for instant search
     */
    static POPULAR_ASSETS = [
        // US ETFs
        { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'QQQI', name: 'NEOS Nasdaq-100 High Income ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'QQQ', name: 'Invesco QQQ Trust (Nasdaq 100)', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'IVV', name: 'iShares Core S&P 500 ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'SCHD', name: 'Schwab US Dividend Equity ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'JEPQ', name: 'JPMorgan Nasdaq Equity Premium Income ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'VTI', name: 'Vanguard Total Stock Market ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'GLD', name: 'SPDR Gold Shares ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'IAU', name: 'iShares Gold Trust ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'VT', name: 'Vanguard Total World Stock ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'ARKK', name: 'ARK Innovation ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'SMH', name: 'VanEck Semiconductor ETF', type: 'ETF', category: 'Stocks / ETFs', currency: 'USD' },

        // Top US Stocks
        { symbol: 'AAPL', name: 'Apple Inc.', type: 'Stock', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Stock', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Stock', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', type: 'Stock', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Stock', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Stock', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Stock', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'AMD', name: 'Advanced Micro Devices', type: 'Stock', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'PLTR', name: 'Palantir Technologies Inc.', type: 'Stock', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'COIN', name: 'Coinbase Global Inc.', type: 'Stock', category: 'Stocks / ETFs', currency: 'USD' },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', type: 'Stock', category: 'Stocks / ETFs', currency: 'USD' },

        // Major Cryptocurrencies
        { symbol: 'BTC', name: 'Bitcoin', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'ETH', name: 'Ethereum', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'SOL', name: 'Solana', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'BNB', name: 'BNB', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'DOGE', name: 'Dogecoin', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'XRP', name: 'XRP / Ripple', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'ADA', name: 'Cardano', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'AVAX', name: 'Avalanche', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'LINK', name: 'Chainlink', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'DOT', name: 'Polkadot', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'SUI', name: 'Sui Network', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'NEAR', name: 'NEAR Protocol', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'PAXG', name: 'PAX Gold (Gold Backed)', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'PEPE', name: 'Pepe', type: 'Crypto', category: 'Crypto', currency: 'USD' },
        { symbol: 'SHIB', name: 'Shiba Inu', type: 'Crypto', category: 'Crypto', currency: 'USD' }
    ];

    /**
     * Search assets by query string across local catalog and Finnhub search API
     * @param {string} query
     * @returns {Promise<Array<{symbol: string, name: string, type: string, category: string, currency: string}>>}
     */
    static async searchAssets(query) {
        if (!query || !query.trim()) return [];
        const q = query.trim().toUpperCase();
        const results = [];
        const seenSymbols = new Set();

        // 1. Search local curated catalogue
        for (const item of this.POPULAR_ASSETS) {
            if (item.symbol.toUpperCase().includes(q) || item.name.toUpperCase().includes(q)) {
                results.push({ ...item, source: 'Catalog' });
                seenSymbols.add(item.symbol.toUpperCase());
            }
        }

        // 2. Query Finnhub Search API if Key is present
        const apiKey = this.getFinnhubApiKey();
        if (apiKey && q.length >= 2) {
            try {
                const url = `${API_ENDPOINTS.finnhub.search}?q=${encodeURIComponent(query.trim())}&token=${apiKey}`;
                const data = await HttpClient.getJson(url, { timeout: API_TIMEOUTS.finnhub });
                if (data && Array.isArray(data.result)) {
                    for (const r of data.result.slice(0, 8)) {
                        const sym = (r.displaySymbol || r.symbol || '').toUpperCase();
                        if (sym && !seenSymbols.has(sym) && !sym.includes('.')) {
                            seenSymbols.add(sym);
                            results.push({
                                symbol: sym,
                                name: r.description || sym,
                                type: r.type === 'ETP' ? 'ETF' : (r.type || 'Stock'),
                                category: 'Stocks / ETFs',
                                currency: 'USD',
                                source: 'Finnhub'
                            });
                        }
                    }
                }
            } catch (_) {}
        }

        return results.slice(0, 10);
    }

    /**
     * Clean and normalize a ticker symbol (e.g., 'btc/usdt' -> 'BTC')
     * @param {string} rawSymbol
     * @returns {string}
     */
    static normalizeSymbol(rawSymbol) {
        if (!rawSymbol) return '';
        let s = rawSymbol.trim().toUpperCase().replace(/[\/\-_]/g, '');
        // Strip trailing USDT/USD if present to get base ticker
        if (s.endsWith('USDT') && s.length > 4) s = s.slice(0, -4);
        else if (s.endsWith('USD') && s.length > 3) s = s.slice(0, -3);
        return s;
    }

    static STORAGE_KEY_FINNHUB = 'tradetracker_finnhub_api_key';

    static getFinnhubApiKey() {
        try {
            return localStorage.getItem(this.STORAGE_KEY_FINNHUB) || '';
        } catch (_) {
            return '';
        }
    }

    static setFinnhubApiKey(key) {
        try {
            if (key && key.trim()) {
                localStorage.setItem(this.STORAGE_KEY_FINNHUB, key.trim());
            } else {
                localStorage.removeItem(this.STORAGE_KEY_FINNHUB);
            }
        } catch (_) {}
    }

    /**
     * Fetch US stock or ETF price from Finnhub API (VOO, QQQI, AAPL, TSLA, etc.)
     * @param {string} symbol - e.g. 'VOO', 'QQQI', 'AAPL', 'TSLA'
     * @returns {Promise<{success: boolean, symbol: string, price: number|null, currency: string, needApiKey?: boolean, error?: string}>}
     */
    static async fetchFinnhubStockPrice(symbol) {
        const cleanSymbol = symbol.trim().toUpperCase();
        const apiKey = this.getFinnhubApiKey();
        if (!apiKey) {
            return {
                success: false,
                needApiKey: true,
                symbol: cleanSymbol,
                price: null,
                currency: 'USD',
                error: 'Finnhub API Key is required to fetch live stock/ETF prices.'
            };
        }

        try {
            const url = `${API_ENDPOINTS.finnhub.quote}?symbol=${cleanSymbol}&token=${apiKey}`;
            const data = await HttpClient.getJson(url, { timeout: API_TIMEOUTS.finnhub });
            if (data && typeof data.c === 'number' && data.c > 0) {
                return {
                    success: true,
                    symbol: cleanSymbol,
                    price: data.c,
                    currency: 'USD',
                    source: 'Finnhub'
                };
            }
        } catch (e) {
            // Failed fetch
        }

        return {
            success: false,
            symbol: cleanSymbol,
            price: null,
            currency: 'USD',
            error: `Could not fetch price for "${cleanSymbol}" from Finnhub.`
        };
    }

    /**
     * Fetch crypto spot price from Coinbase Public API (CORS-friendly, no API key required)
     * @param {string} symbol - e.g. 'BTC', 'ETH', 'SOL', 'DOGE'
     * @returns {Promise<{success: boolean, symbol: string, price: number|null, currency: string, source?: string}>}
     */
    static async fetchCoinbasePrice(symbol) {
        const cleanSymbol = symbol.trim().toUpperCase();
        try {
            const url = `${API_ENDPOINTS.coinbase.spotPrice}/${cleanSymbol}-USD/spot`;
            const data = await HttpClient.getJson(url, { timeout: API_TIMEOUTS.market });
            if (data && data.data && data.data.amount) {
                const price = parseFloat(data.data.amount);
                if (!isNaN(price) && price > 0) {
                    return {
                        success: true,
                        symbol: cleanSymbol,
                        price,
                        currency: 'USD',
                        source: 'Coinbase'
                    };
                }
            }
        } catch (_) {}
        return { success: false, symbol: cleanSymbol, price: null, currency: 'USD' };
    }

    /**
     * Fetch crypto price from CoinGecko API as secondary fallback (CORS-friendly)
     * @param {string} symbol - e.g. 'BTC', 'ETH'
     * @returns {Promise<{success: boolean, symbol: string, price: number|null, currency: string, source?: string}>}
     */
    static async fetchCoinGeckoPrice(symbol) {
        const cleanSymbol = symbol.trim().toUpperCase();
        try {
            const geckoId = this.COINGECKO_MAP[cleanSymbol] || cleanSymbol.toLowerCase();
            const url = `${API_ENDPOINTS.coinGecko.price}?ids=${geckoId}&vs_currencies=usd`;
            const data = await HttpClient.getJson(url, { timeout: API_TIMEOUTS.market });
            if (data && data[geckoId] && data[geckoId].usd) {
                const price = parseFloat(data[geckoId].usd);
                if (!isNaN(price) && price > 0) {
                    return {
                        success: true,
                        symbol: cleanSymbol,
                        price,
                        currency: 'USD',
                        source: 'CoinGecko'
                    };
                }
            }
        } catch (_) {}
        return { success: false, symbol: cleanSymbol, price: null, currency: 'USD' };
    }

    /**
     * Fetch real-time market price for a given ticker symbol.
     * Directs Crypto to Coinbase/CoinGecko and Stocks/ETFs (VOO, QQQI, AAPL) to Finnhub without triggering CORS errors.
     * @param {string} symbol - e.g. 'BTC', 'ETH', 'VOO', 'QQQI', 'AAPL', 'TSLA'
     * @returns {Promise<{success: boolean, symbol: string, price: number|null, currency: string, needApiKey?: boolean, error?: string}>}
     */
    static async fetchLivePrice(symbol) {
        const cleanSymbol = this.normalizeSymbol(symbol);
        if (!cleanSymbol) {
            return { success: false, symbol: '', price: null, currency: 'USD', error: 'Empty symbol' };
        }

        const isCrypto = this.KNOWN_CRYPTO.has(cleanSymbol) || !!this.COINGECKO_MAP[cleanSymbol];

        if (isCrypto) {
            // 1. Primary for Crypto: Coinbase Spot API (Public, CORS-friendly, zero key needed)
            const coinbaseRes = await this.fetchCoinbasePrice(cleanSymbol);
            if (coinbaseRes.success) return coinbaseRes;

            // 2. Fallback for Crypto: CoinGecko API
            const geckoRes = await this.fetchCoinGeckoPrice(cleanSymbol);
            if (geckoRes.success) return geckoRes;

            return {
                success: false,
                symbol: cleanSymbol,
                price: null,
                currency: 'USD',
                error: `Could not fetch live price for crypto "${cleanSymbol}".`
            };
        }

        // For Stocks & ETFs (e.g. VOO, QQQI, AAPL, NVDA, SPY):
        // Query Finnhub directly (zero Binance calls, preventing any CORS errors)
        const stockResult = await this.fetchFinnhubStockPrice(cleanSymbol);
        if (stockResult.success || stockResult.needApiKey) {
            return stockResult;
        }

        // Secondary fallback: Check Coinbase spot in case of unknown/new crypto ticker
        const fallbackCrypto = await this.fetchCoinbasePrice(cleanSymbol);
        if (fallbackCrypto.success) return fallbackCrypto;

        const fallbackGecko = await this.fetchCoinGeckoPrice(cleanSymbol);
        if (fallbackGecko.success) return fallbackGecko;

        return {
            success: false,
            symbol: cleanSymbol,
            price: null,
            currency: 'USD',
            error: `Market price for "${cleanSymbol}" could not be fetched automatically.`
        };
    }

    /**
     * Calculate volatile asset financial metrics.
     * @param {number} quantity - Number of units held
     * @param {number} avgCost - Average buy price per unit (in asset currency)
     * @param {number} currentPrice - Current market price per unit (in asset currency)
     * @param {string} assetCurrency - Currency of prices ('USD' or 'THB')
     * @param {number} fxRate - Current USD to THB exchange rate
     * @returns {Object}
     */
    static calculateMetrics(quantity, avgCost, currentPrice, assetCurrency = 'USD', fxRate = 35.5) {
        const qty = parseFloat(quantity) || 0;
        const cost = parseFloat(avgCost) || 0;
        const price = parseFloat(currentPrice) || 0;
        const rate = fxRate > 0 ? fxRate : 35.5;

        const totalCostRaw = qty * cost;
        const totalValueRaw = qty * price;
        const unrealizedPnlRaw = totalValueRaw - totalCostRaw;
        const unrealizedPnlPercent = cost > 0 ? ((price - cost) / cost) * 100 : 0;

        // Base storage currency is always THB in this system
        let amountInThb = totalValueRaw;
        let costInThb = totalCostRaw;
        let pnlInThb = unrealizedPnlRaw;

        if (assetCurrency === 'USD') {
            amountInThb = totalValueRaw * rate;
            costInThb = totalCostRaw * rate;
            pnlInThb = unrealizedPnlRaw * rate;
        }

        return {
            quantity: qty,
            avgCost: cost,
            currentPrice: price,
            assetCurrency,
            totalCostRaw,
            totalValueRaw,
            unrealizedPnl: unrealizedPnlRaw,
            unrealizedPnlPercent,
            amountInThb,
            costInThb,
            pnlInThb
        };
    }

    /**
     * Refresh prices for all volatile items in manager.
     * @param {Object} manager - NetWorthManager instance
     * @returns {Promise<{updatedCount: number, failedCount: number}>}
     */
    static async refreshAllVolatileItems(manager) {
        const volatileItems = (manager.items || []).filter(item => item.isVolatile && item.symbol);
        if (volatileItems.length === 0) {
            return { updatedCount: 0, failedCount: 0 };
        }

        let updatedCount = 0;
        let failedCount = 0;

        await Promise.all(volatileItems.map(async (item) => {
            const result = await this.fetchLivePrice(item.symbol);
            if (result.success && result.price) {
                const metrics = this.calculateMetrics(
                    item.quantity,
                    item.avgCost,
                    result.price,
                    item.assetCurrency || 'USD',
                    manager.exchangeRate
                );

                item.currentPrice = result.price;
                item.amount = metrics.amountInThb;
                item.unrealizedPnl = metrics.unrealizedPnl;
                item.unrealizedPnlPercent = metrics.unrealizedPnlPercent;
                item.updatedAt = new Date().toISOString();
                updatedCount++;
            } else {
                failedCount++;
            }
        }));

        if (updatedCount > 0) {
            manager.updateWeeklySnapshot();
            await manager.saveData();
            manager.render();
        }

        return { updatedCount, failedCount };
    }
}
