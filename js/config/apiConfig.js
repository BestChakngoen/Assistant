/**
 * apiConfig.js - Centralized API Endpoints, Configurations & Timeouts Registry
 * Single Source of Truth for all external Web APIs, BaaS configurations, and HTTP parameters.
 * Adheres strictly to SOLID principles, OOP standards, and Zero Hardcoded Secrets.
 */

export const SUPABASE_CONFIG = Object.freeze({
    url: 'https://ujjwaxdwemrdszyatgxw.supabase.co',
    publishableKey: 'sb_publishable_Zov-pzfGxNS9yUAGwfhMEg_9PxBeYG3'
});

export const API_ENDPOINTS = Object.freeze({
    binance: {
        price: 'https://api.binance.com/api/v3/ticker/price'
    },
    coinGecko: {
        price: 'https://api.coingecko.com/api/v3/simple/price'
    },
    coinbase: {
        spotPrice: 'https://api.coinbase.com/v2/prices'
    },
    finnhub: {
        search: 'https://finnhub.io/api/v1/search',
        quote: 'https://finnhub.io/api/v1/quote'
    },
    exchangeRate: {
        usdLatest: 'https://open.er-api.com/v6/latest/USD',
        fallback: 'https://api.exchangerate.host/latest'
    },
    openMeteo: {
        weather: 'https://api.open-meteo.com/v1/forecast',
        airQuality: 'https://air-quality-api.open-meteo.com/v1/air-quality'
    },
    tradingView: {
        chartScript: 'https://s3.tradingview.com/tv.js',
        eventsScript: 'https://s3.tradingview.com/external-embedding/embed-widget-events.js'
    }
});

export const API_TIMEOUTS = Object.freeze({
    default: 8000,
    market: 6000,
    exchangeRate: 5000,
    weather: 8000,
    finnhub: 6000,
    supabase: 10000
});
