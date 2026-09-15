import { SUPABASE_CONFIG } from '../../config/apiConfig.js';

/**
 * SupabaseClient.js - Singleton Provider for Supabase BaaS Client
 * Ensures a single shared Supabase instance across the entire application,
 * eliminating duplicate client instantiations and centralizing credentials.
 */
let _supabaseInstance = null;

export function getSupabaseClient() {
    if (typeof window === 'undefined') return null;

    // 1. Reuse existing instance if already created
    if (_supabaseInstance) {
        return _supabaseInstance;
    }

    // 2. Check if already attached to window.supabaseClient
    if (window.supabaseClient) {
        _supabaseInstance = window.supabaseClient;
        return _supabaseInstance;
    }

    // 3. Check if window.shareManager has an active client
    if (window.shareManager?.supabase) {
        _supabaseInstance = window.shareManager.supabase;
        window.supabaseClient = _supabaseInstance;
        return _supabaseInstance;
    }

    // 4. Create new client from window.supabase CDN library
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
            _supabaseInstance = window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.publishableKey
            );
            window.supabaseClient = _supabaseInstance;
            return _supabaseInstance;
        } catch (err) {
            console.error('[SupabaseClient] Failed to initialize Supabase client:', err);
            return null;
        }
    }

    return null;
}

export function resetSupabaseClient() {
    _supabaseInstance = null;
    if (typeof window !== 'undefined') {
        window.supabaseClient = null;
    }
}
