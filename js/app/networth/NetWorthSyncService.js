import { API_ENDPOINTS, API_TIMEOUTS } from '../../config/apiConfig.js';
import { HttpClient } from '../../services/api/HttpClient.js';
import { getSupabaseClient } from '../../services/api/SupabaseClient.js';
import { NetWorthPortfolioService } from './NetWorthPortfolioService.js';

/**
 * NetWorthSyncService.js - Network, Live Currency & Supabase Realtime Sync
 * Manages exchange rate fetching, Supabase synchronization, and real-time custom portfolio folders.
 */
export class NetWorthSyncService {
    static _eventsBound = false;

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

    static bindLifecycleEvents(manager) {
        if (this._eventsBound) return;
        this._eventsBound = true;

        if (typeof window !== 'undefined') {
            window.addEventListener('online', () => {
                this.initSupabaseSync(manager);
            });
        }

        if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'visible') {
                    this.pullLatestFromCloud(manager);
                }
            });
        }
    }

    static async pullLatestFromCloud(manager) {
        if (typeof window === 'undefined') return;
        const supabase = getSupabaseClient();
        if (!supabase) return;

        try {
            const uid = window.app?.auth?.currentUser?.uid || 'default_user';
            const { data, error } = await supabase
                .from('net_worth')
                .select('*')
                .eq('user_id', uid)
                .maybeSingle();

            if (!error && data) {
                let updated = false;

                let cloudItems = data.items;
                if (typeof cloudItems === 'string') {
                    try { cloudItems = JSON.parse(cloudItems); } catch (_) {}
                }
                if (Array.isArray(cloudItems)) {
                    manager.items = cloudItems;
                    localStorage.setItem(manager.storageKey, JSON.stringify(manager.items));
                    updated = true;
                }

                let cloudSnapshots = data.snapshots;
                if (typeof cloudSnapshots === 'string') {
                    try { cloudSnapshots = JSON.parse(cloudSnapshots); } catch (_) {}
                }
                if (cloudSnapshots && typeof cloudSnapshots === 'object') {
                    manager.snapshots = cloudSnapshots;
                    localStorage.setItem(manager.snapshotStorageKey, JSON.stringify(manager.snapshots));
                    if (Array.isArray(cloudSnapshots._customPortfolios)) {
                        NetWorthPortfolioService.setPortfolios(manager, cloudSnapshots._customPortfolios);
                    }
                    updated = true;
                }

                if (updated) {
                    manager.populatePortfolioDropdowns();
                    manager.render();
                }
                this.updateCloudStatus(true);
            }
        } catch (err) {
            console.warn('Could not pull latest NetWorth from cloud:', err);
        }
    }

    static async initSupabaseSync(manager) {
        if (typeof window === 'undefined') return;

        const supabase = getSupabaseClient();

        if (!supabase) {
            this.updateCloudStatus(false);
            return;
        }

        try {
            this.bindLifecycleEvents(manager);
            await this.pullLatestFromCloud(manager);

            const uid = window.app?.auth?.currentUser?.uid || 'default_user';

            // Realtime Subscription (Remove existing channel if subscribed)
            if (manager.netWorthChannel) {
                try { supabase.removeChannel(manager.netWorthChannel); } catch (e) {}
            }

            manager.netWorthChannel = supabase
                .channel('networth_realtime_' + Date.now())
                .on('postgres_changes', { event: '*', schema: 'public', table: 'net_worth' }, (payload) => {
                    const currentUid = window.app?.auth?.currentUser?.uid || 'default_user';
                    if (payload.new && (payload.new.user_id === currentUid || !payload.new.user_id)) {
                        let newItems = payload.new.items;
                        if (typeof newItems === 'string') {
                            try { newItems = JSON.parse(newItems); } catch (_) {}
                        }
                        if (Array.isArray(newItems)) {
                            manager.items = newItems;
                            localStorage.setItem(manager.storageKey, JSON.stringify(manager.items));
                        }

                        let newSnapshots = payload.new.snapshots;
                        if (typeof newSnapshots === 'string') {
                            try { newSnapshots = JSON.parse(newSnapshots); } catch (_) {}
                        }
                        if (newSnapshots && typeof newSnapshots === 'object') {
                            manager.snapshots = newSnapshots;
                            localStorage.setItem(manager.snapshotStorageKey, JSON.stringify(manager.snapshots));
                            if (Array.isArray(newSnapshots._customPortfolios)) {
                                NetWorthPortfolioService.setPortfolios(manager, newSnapshots._customPortfolios);
                            }
                        }

                        manager.populatePortfolioDropdowns();
                        manager.render();
                    }
                })
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        this.updateCloudStatus(true);
                    } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                        this.updateCloudStatus(false);
                    }
                });
        } catch (err) {
            console.warn('Supabase NetWorth sync notice:', err);
            this.updateCloudStatus(false);
        }
    }

    static updateCloudStatus(isConnected) {
        const statusEl = document.getElementById('nw-cloud-status');
        if (!statusEl) return;

        if (isConnected) {
            statusEl.className = 'text-xs font-mono text-green-400 bg-green-500/10 px-3 py-1.5 rounded-xl border-0 font-bold flex items-center gap-1.5';
            statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span><span>CLOUD SYNC ACTIVE</span>`;
        } else {
            statusEl.className = 'text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border-0 font-bold flex items-center gap-1.5';
            statusEl.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span><span>STANDALONE MODE (OFFLINE)</span>`;
        }
    }

    static async saveToSupabase(manager) {
        if (typeof window === 'undefined') return;
        try {
            const supabase = getSupabaseClient();
            if (supabase) {
                const uid = window.app?.auth?.currentUser?.uid || 'default_user';
                const portfolios = NetWorthPortfolioService.getPortfolios(manager);
                const snapshots = {
                    ...(manager.snapshots || {}),
                    _customPortfolios: portfolios
                };
                manager.snapshots = snapshots;

                const { error } = await supabase
                    .from('net_worth')
                    .upsert([{
                        user_id: uid,
                        items: manager.items,
                        snapshots: snapshots,
                        updated_at: new Date().toISOString()
                    }], { onConflict: 'user_id' });

                if (error) {
                    console.error('Failed to save Net Worth data to Supabase:', error);
                    this.updateCloudStatus(false);
                } else {
                    this.updateCloudStatus(true);
                }
            }
        } catch (e) {
            console.error('Failed to save Net Worth data to Supabase:', e);
            this.updateCloudStatus(false);
        }
    }
}
