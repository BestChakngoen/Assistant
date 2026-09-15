import { API_ENDPOINTS, API_TIMEOUTS } from '../config/apiConfig.js';
import { HttpClient } from './api/HttpClient.js';

// --- FILE 3: MARKET SERVICE ---
export class MarketService {
    constructor() {
        this.symbols = {
            'BTC/USD': 'BTCUSDT',
            'XAU/USD': 'PAXGUSDT',
            'EUR/USD': 'EURUSDT'
        };
        this.prevPrice = 0;
        this.thbCache = null;
        this.thbCacheTime = 0;
        this.thbCacheDuration = 300000; // 5 minutes
    }

    async fetchPrice(asset) {
        if(!this.symbols[asset]) return null;
        // Primary: Binance
        try {
            const url = `${API_ENDPOINTS.binance.price}?symbol=${this.symbols[asset]}&t=${Date.now()}`;
            const d = await HttpClient.getJson(url, { timeout: API_TIMEOUTS.market });
            if(d && d.price) return parseFloat(d.price);
        } catch (e) {
            // continue to fallback
        }

        // Fallbacks: CoinGecko for crypto/gold tokens, exchangerate for fiat
        try {
            if(asset === 'BTC/USD') {
                const url = `${API_ENDPOINTS.coinGecko.price}?ids=bitcoin&vs_currencies=usd`;
                const j = await HttpClient.getJson(url, { timeout: API_TIMEOUTS.market });
                return j?.bitcoin?.usd ? parseFloat(j.bitcoin.usd) : null;
            }
            if(asset === 'XAU/USD') {
                // PAX Gold (pax-gold) price in USD
                const url = `${API_ENDPOINTS.coinGecko.price}?ids=pax-gold&vs_currencies=usd`;
                const j = await HttpClient.getJson(url, { timeout: API_TIMEOUTS.market });
                return j?.['pax-gold']?.usd ? parseFloat(j['pax-gold'].usd) : null;
            }
            if(asset === 'EUR/USD') {
                // Exchange rate EUR -> USD
                const url = `${API_ENDPOINTS.exchangeRate.fallback}?base=EUR&symbols=USD`;
                const j = await HttpClient.getJson(url, { timeout: API_TIMEOUTS.market });
                return j?.rates?.USD ? parseFloat(j.rates.USD) : null;
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    async fetchTHB() {
        try {
            const d = await HttpClient.getJson(API_ENDPOINTS.exchangeRate.usdLatest, {
                timeout: API_TIMEOUTS.exchangeRate,
                cacheTtlMs: this.thbCacheDuration
            });
            const rate = d?.rates?.THB || null;
            if(rate) {
                this.thbCache = rate;
                this.thbCacheTime = Date.now();
                return rate;
            }
        } catch (e) {
            console.warn('fetchTHB error:', e.message);
        }

        // Return cached value if available, even if stale
        return this.thbCache;
    }
}
