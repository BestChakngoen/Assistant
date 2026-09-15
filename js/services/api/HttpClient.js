import { API_TIMEOUTS } from '../../config/apiConfig.js';

/**
 * HttpClient.js - Centralized HTTP Fetch Client with Timeout, Cache & Resilience
 * Standardizes network communication across domain services, provides uniform error handling,
 * request abort timeouts, and shared in-memory response caching.
 */
export class HttpClient {
    static _cache = new Map();

    /**
     * Executes an HTTP GET request and parses the JSON response.
     * @param {string} url - Target URL
     * @param {object} options - Fetch options (timeout, headers, cacheTtlMs, etc.)
     * @returns {Promise<any|null>} Parsed JSON response or null on failure
     */
    static async getJson(url, options = {}) {
        const timeoutMs = options.timeout || API_TIMEOUTS.default;
        const cacheTtlMs = options.cacheTtlMs || 0;

        // Check in-memory cache if TTL is specified
        if (cacheTtlMs > 0) {
            const cached = this._getCached(url);
            if (cached !== null) {
                return cached;
            }
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const fetchOptions = {
                method: 'GET',
                signal: controller.signal,
                headers: options.headers || {}
            };

            const response = await fetch(url, fetchOptions);
            clearTimeout(timer);

            if (!response.ok) {
                return null;
            }

            const data = await response.json();

            // Save to in-memory cache if TTL > 0
            if (cacheTtlMs > 0 && data !== null && typeof data !== 'undefined') {
                this._setCached(url, data, cacheTtlMs);
            }

            return data;
        } catch (err) {
            clearTimeout(timer);
            return null;
        }
    }

    /**
     * Executes an HTTP POST request with a JSON payload.
     * @param {string} url - Target URL
     * @param {any} body - JSON serializable body
     * @param {object} options - Options (timeout, headers)
     * @returns {Promise<any|null>}
     */
    static async postJson(url, body, options = {}) {
        const timeoutMs = options.timeout || API_TIMEOUTS.default;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const fetchOptions = {
                method: 'POST',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                body: JSON.stringify(body)
            };

            const response = await fetch(url, fetchOptions);
            clearTimeout(timer);

            if (!response.ok) {
                return null;
            }

            return await response.json();
        } catch (err) {
            clearTimeout(timer);
            return null;
        }
    }

    /**
     * Helper to read unexpired item from cache
     */
    static _getCached(key) {
        const entry = this._cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiry) {
            this._cache.delete(key);
            return null;
        }
        return entry.data;
    }

    /**
     * Helper to write item into cache
     */
    static _setCached(key, data, ttlMs) {
        this._cache.set(key, {
            data,
            expiry: Date.now() + ttlMs
        });
    }

    /**
     * Clears all or a specific cached entry
     * @param {string} [key] - Optional specific cache key to clear
     */
    static clearCache(key) {
        if (key) {
            this._cache.delete(key);
        } else {
            this._cache.clear();
        }
    }
}
