import { API_ENDPOINTS, API_TIMEOUTS } from '../../config/apiConfig.js';
import { HttpClient } from '../../services/api/HttpClient.js';
import { getSupabaseClient } from '../../services/api/SupabaseClient.js';

/**
 * NetWorthSyncService.js - Network, Live Currency & Supabase Realtime Sync
 * Manages exchange rate fetching and Supabase synchronization for NetWorthManager.
 */
export class NetWorthSyncService {
    static async fetchExchangeRate(forceRefresh = false) {
        try {
            const data = await HttpClient.getJson(API_ENDPOINTS.exchangeRate.usdLatest, {
                timeout: API_TIMEOUTS.exchangeRate,
                cacheTtlMs: 300000, // 5-minute shared cache
                forceRefresh
            });
            if (data && data.rates && data.rates.THB) {
                return data.rates.THB;
            }
        } catch (e) {
            console.warn('Could not fetch live exchange rate, using fallback 35.5:', e);
        }
        return 35.5;
    }

    static async initSupabaseSync(manager) {
        if (typeof window === 'undefined') return;

        const supabase = getSupabaseClient();

        if (!supabase) {
            this.updateCloudStatus(false);
            return;
        }

        try {
            const uid = window.app?.auth?.currentUser?.uid || 'default_user';
            this.updateCloudStatus(true);

            // Fetch initial NetWorth data from Supabase net_worth table
            const { data, error } = await supabase
                .from('net_worth')
                .select('*')
                .eq('user_id', uid)
                .maybeSingle();

            if (!error && data) {
                if (Array.isArray(data.items)) manager.items = data.items;
                if (data.snapshots && typeof data.snapshots === 'object') manager.snapshots = data.snapshots;
                localStorage.setItem(manager.storageKey, JSON.stringify(manager.items));
                localStorage.setItem(manager.snapshotStorageKey, JSON.stringify(manager.snapshots));
                manager.render();
            }

            // Realtime Subscription (Remove existing channel if subscribed)
            if (manager.netWorthChannel) {
                try { supabase.removeChannel(manager.netWorthChannel); } catch (e) {}
            }
            manager.netWorthChannel = supabase
                .channel('networth_realtime_' + Date.now())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'net_worth' }, (payload) => {
                    if (payload.new && (payload.new.user_id === uid || !payload.new.user_id)) {
                        if (Array.isArray(payload.new.items)) manager.items = payload.new.items;
                        if (payload.new.snapshots && typeof payload.new.snapshots === 'object') manager.snapshots = payload.new.snapshots;
                        localStorage.setItem(manager.storageKey, JSON.stringify(manager.items));
                        localStorage.setItem(manager.snapshotStorageKey, JSON.stringify(manager.snapshots));
                        manager.render();
                    }
                })
                .subscribe();
        } catch (err) {
            console.warn('Supabase NetWorth sync notice:', err);
            this.updateCloudStatus(false);
        }
    }

    static updateCloudStatus(isConnected) {
        const statusEl = document.getElementById('nw-cloud-status');
        if (!statusEl) return;

        if (isConnected) {
            statusEl.className = 'text-xs font-mono text-green-400 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20 font-bold flex items-center gap-1.5';
            statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span><span>CLOUD SYNC ACTIVE</span>`;
        } else {
            statusEl.className = 'text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 font-bold flex items-center gap-1.5';
            statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span><span>STANDALONE MODE (OFFLINE)</span>`;
        }
    }

    static async saveToSupabase(manager) {
        if (typeof window === 'undefined') return;
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                const uid = window.app?.auth?.currentUser?.uid || 'default_user';
                await supabase
                    .from('net_worth')
                    .upsert([{
                        user_id: uid,
                        items: manager.items,
                        snapshots: manager.snapshots,
                        updated_at: new Date().toISOString()
                    }], { onConflict: 'user_id' });
            }
        } catch (e) {
            console.error('Failed to save Net Worth data to Supabase:', e);
        }
    }
}
