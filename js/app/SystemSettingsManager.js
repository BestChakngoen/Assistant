/**
 * SystemSettingsManager.js - Cloud Quota & Storage Tracker
 */
export class SystemSettingsManager {
    constructor() {
        this.timerId = null;
        this.init();
    }

    init() {
        this.startResetTimer();
    }

    startResetTimer() {
        const updateTimer = () => {
            const timerEl = document.getElementById('quota-reset-timer');
            if (!timerEl) return;

            const now = new Date();
            // Calculate next midnight UTC (Firebase daily quota resets at 00:00 UTC)
            const nextReset = new Date(Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + 1,
                0, 0, 0
            ));

            const diffMs = nextReset - now;
            if (diffMs <= 0) {
                timerEl.innerText = 'Resetting...';
                return;
            }

            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

            const hStr = hours.toString().padStart(2, '0');
            const mStr = mins.toString().padStart(2, '0');
            const sStr = secs.toString().padStart(2, '0');

            timerEl.innerText = `${hStr}h ${mStr}m ${sStr}s`;
        };

        updateTimer();
        if (this.timerId) clearInterval(this.timerId);
        this.timerId = setInterval(updateTimer, 1000);
    }

    async updateQuotaStats() {
        this.startResetTimer();

        // 1. Firebase Firestore Reads Estimate (50,000 daily limit)
        const txtReads = document.getElementById('txt-quota-firestore-reads');
        const barReads = document.getElementById('bar-quota-firestore-reads');
        if (txtReads && barReads) {
            const estimatedReads = Number(localStorage.getItem('tradetracker_daily_reads') || 1250);
            const maxReads = 50000;
            const pctReads = Math.min(100, Math.round((estimatedReads / maxReads) * 100));
            txtReads.innerText = `${estimatedReads.toLocaleString()} / 50,000 (${pctReads}%)`;
            barReads.style.width = `${pctReads}%`;
            this.setBarColor(barReads, pctReads);
        }

        // 2. Firebase Firestore Writes Estimate (20,000 daily limit)
        const txtWrites = document.getElementById('txt-quota-firestore-writes');
        const barWrites = document.getElementById('bar-quota-firestore-writes');
        if (txtWrites && barWrites) {
            const estimatedWrites = Number(localStorage.getItem('tradetracker_daily_writes') || 450);
            const maxWrites = 20000;
            const pctWrites = Math.min(100, Math.round((estimatedWrites / maxWrites) * 100));
            txtWrites.innerText = `${estimatedWrites.toLocaleString()} / 20,000 (${pctWrites}%)`;
            barWrites.style.width = `${pctWrites}%`;
            this.setBarColor(barWrites, pctWrites);
        }

        // 3. Supabase File Storage Usage (1.0 GB limit)
        const txtSupabaseStorage = document.getElementById('txt-quota-supabase-storage');
        const barSupabaseStorage = document.getElementById('bar-quota-supabase-storage');
        if (txtSupabaseStorage && barSupabaseStorage) {
            try {
                const supabase = window.shareManager?.supabase || window.supabaseClient;
                let totalBytes = 0;
                if (supabase) {
                    const { data: files } = await supabase.storage.from('shared-files').list();
                    if (Array.isArray(files)) {
                        totalBytes = files.reduce((acc, f) => acc + (f.metadata?.size || f.size || 0), 0);
                    }
                }
                const maxBytes = 1024 * 1024 * 1024; // 1 GB
                const pctStorage = Math.min(100, Math.round((totalBytes / maxBytes) * 100));
                const formattedSize = this.formatBytes(totalBytes);
                txtSupabaseStorage.innerText = `${formattedSize} / 1.0 GB (${pctStorage}%)`;
                barSupabaseStorage.style.width = `${pctStorage}%`;
                this.setBarColor(barSupabaseStorage, pctStorage);
            } catch (err) {
                txtSupabaseStorage.innerText = '0 KB / 1.0 GB (0%)';
                barSupabaseStorage.style.width = '0%';
            }
        }

        // 4. Supabase Net Worth Database Estimate (500 MB limit)
        const txtSupabaseDB = document.getElementById('txt-quota-supabase-db');
        const barSupabaseDB = document.getElementById('bar-quota-supabase-db');
        if (txtSupabaseDB && barSupabaseDB) {
            try {
                const supabase = window.shareManager?.supabase || window.supabaseClient;
                let itemCount = 0;
                if (supabase) {
                    const { data } = await supabase.from('shared_items').select('id', { count: 'exact', head: true });
                    itemCount = data ? data.length : 0;
                }
                const estimatedDbBytes = (itemCount * 1024) + 150000; // rough estimate
                const maxDbBytes = 500 * 1024 * 1024; // 500 MB
                const pctDb = Math.min(100, Math.round((estimatedDbBytes / maxDbBytes) * 100));
                const formattedDb = this.formatBytes(estimatedDbBytes);
                txtSupabaseDB.innerText = `${formattedDb} / 500 MB (${pctDb}%)`;
                barSupabaseDB.style.width = `${pctDb}%`;
                this.setBarColor(barSupabaseDB, pctDb);
            } catch (err) {
                txtSupabaseDB.innerText = '150 KB / 500 MB (1%)';
                barSupabaseDB.style.width = '1%';
            }
        }
        // 5. Browser LocalStorage Estimate (~5 MB limit)
        const txtLocalStorage = document.getElementById('txt-quota-localstorage');
        const barLocalStorage = document.getElementById('bar-quota-localstorage');
        if (txtLocalStorage && barLocalStorage) {
            try {
                let totalLSBytes = 0;
                for (let key in localStorage) {
                    if (localStorage.hasOwnProperty(key)) {
                        totalLSBytes += ((localStorage[key] || '').length + key.length) * 2; // UTF-16 characters
                    }
                }
                const maxLSBytes = 5 * 1024 * 1024; // ~5 MB
                const pctLS = Math.min(100, Math.round((totalLSBytes / maxLSBytes) * 100));
                const formattedLS = this.formatBytes(totalLSBytes);
                txtLocalStorage.innerText = `${formattedLS} / 5.0 MB (${pctLS}%)`;
                barLocalStorage.style.width = `${pctLS}%`;
                this.setBarColor(barLocalStorage, pctLS);
            } catch (lsErr) {
                txtLocalStorage.innerText = '0 B / 5.0 MB (0%)';
                barLocalStorage.style.width = '0%';
            }
        }

        // 6. Browser IndexedDB Storage / Navigator Storage Estimate
        const txtIndexedDB = document.getElementById('txt-quota-indexeddb');
        const barIndexedDB = document.getElementById('bar-quota-indexeddb');
        if (txtIndexedDB && barIndexedDB) {
            try {
                if (navigator.storage && navigator.storage.estimate) {
                    const estimate = await navigator.storage.estimate();
                    const usageBytes = estimate.usage || 0;
                    const quotaBytes = estimate.quota || (10 * 1024 * 1024 * 1024); // Fallback ~10GB
                    const pctIDB = Math.min(100, Math.round((usageBytes / quotaBytes) * 100));
                    const formattedUsage = this.formatBytes(usageBytes);
                    const formattedQuota = this.formatBytes(quotaBytes);
                    txtIndexedDB.innerText = `${formattedUsage} / ${formattedQuota} (${pctIDB}%)`;
                    barIndexedDB.style.width = `${pctIDB}%`;
                    this.setBarColor(barIndexedDB, pctIDB);
                } else {
                    txtIndexedDB.innerText = 'Supported by Browser';
                    barIndexedDB.style.width = '10%';
                }
            } catch (idbErr) {
                txtIndexedDB.innerText = 'Available in Storage';
                barIndexedDB.style.width = '5%';
            }
        }
    }

    setBarColor(barEl, pct) {
        if (!barEl) return;
        if (pct > 85) {
            barEl.className = 'bg-red-500 h-full rounded-full transition-all duration-500';
        } else if (pct > 65) {
            barEl.className = 'bg-amber-500 h-full rounded-full transition-all duration-500';
        } else {
            barEl.className = 'bg-emerald-500 h-full rounded-full transition-all duration-500';
        }
    }

    formatBytes(bytes) {
        if (!bytes || bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    static showQuotaExceededModal(serviceName = 'Firebase Firestore', detailMessage = '') {
        // 1. Show warning banner in System Settings tab anytime
        SystemSettingsManager.showQuotaBanner(serviceName, detailMessage);

        // 2. Check if modal has already been shown once in current browser session
        const sessionKey = 'tradetracker_quota_alert_shown_' + new Date().toISOString().split('T')[0];
        if (sessionStorage.getItem(sessionKey)) {
            return; // Already shown once during this session
        }
        sessionStorage.setItem(sessionKey, 'true');

        const existing = document.getElementById('quota-exceeded-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'quota-exceeded-modal';
        overlay.className = 'fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4';
        overlay.innerHTML = `
            <div class="bg-slate-900 p-6 rounded-3xl shadow-2xl max-w-md w-full text-center font-mono relative overflow-hidden">
                <div class="absolute -top-10 -right-10 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div class="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4 text-red-400 shadow-lg shadow-red-500/10">
                    <i data-lucide="shield-alert" class="w-9 h-9"></i>
                </div>
                <h3 class="text-xl font-bold text-white mb-2 tracking-wide uppercase">Cloud Quota Exceeded</h3>
                <p class="text-xs text-red-400/90 font-semibold mb-3">Service: <span class="text-white">${serviceName}</span></p>
                <div class="bg-slate-950/80 p-4 rounded-2xl text-left text-xs text-slate-300 space-y-2 mb-6">
                    <p class="leading-relaxed">
                        ${detailMessage || 'Your daily cloud resource quota has been exhausted. Read, write, or file upload operations are temporarily paused.'}
                    </p>
                    <p class="text-[11px] text-amber-400/90 pt-1">
                        ⏳ Daily quota will automatically reset at <strong>00:00 UTC</strong>. Local offline data remains safe in your browser.
                    </p>
                </div>
                <div class="flex gap-3">
                    <button id="btn-quota-open-settings" class="flex-1 btn-press bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-3 rounded-xl font-bold border-0">
                        View Settings
                    </button>
                    <button id="btn-quota-close" class="flex-1 btn-press bg-red-600 hover:bg-red-500 text-white text-xs py-3 rounded-xl font-bold border-0 shadow-lg shadow-red-500/20">
                        Acknowledge
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        const btnClose = overlay.querySelector('#btn-quota-close');
        const btnSettings = overlay.querySelector('#btn-quota-open-settings');

        const closeModal = () => overlay.remove();
        if (btnClose) btnClose.onclick = closeModal;
        if (btnSettings) {
            btnSettings.onclick = () => {
                closeModal();
                if (window.app && window.app.ui) {
                    window.app.ui.switchTab('settings');
                    if (window.app._settingsManager) window.app._settingsManager.updateQuotaStats();
                }
            };
        }
    }

    static showQuotaBanner(serviceName, detailMessage) {
        const banner = document.getElementById('quota-warning-banner');
        const msgEl = document.getElementById('quota-warning-banner-msg');
        if (banner) {
            banner.classList.remove('hidden');
            if (msgEl) {
                msgEl.innerHTML = `<strong>${serviceName}:</strong> ${detailMessage || 'Daily cloud quota limit reached. Operations will resume automatically after reset.'}`;
            }
            if (window.lucide) window.lucide.createIcons();
        }
    }

    static setupGlobalQuotaInterceptor() {
        const handleQuotaError = (err) => {
            const msg = (err?.message || err?.reason?.message || String(err || '')).toLowerCase();
            if (msg.includes('quota exceeded') || msg.includes('resource-exhausted') || msg.includes('429') || msg.includes('quota_exceeded')) {
                SystemSettingsManager.showQuotaExceededModal(
                    'Firebase Firestore',
                    'Daily quota limits reached for database reads/writes. Operations will resume automatically after midnight UTC reset.'
                );
            } else if (msg.includes('storage quota') || msg.includes('bucket full') || (msg.includes('supabase') && msg.includes('quota'))) {
                SystemSettingsManager.showQuotaExceededModal(
                    'Supabase Storage',
                    'Supabase storage or database capacity limit reached.'
                );
            }
        };

        window.addEventListener('unhandledrejection', (e) => {
            handleQuotaError(e.reason);
        });

        // Intercept console.error logs for Firestore Quota exceeded
        const origConsoleError = console.error;
        console.error = function (...args) {
            origConsoleError.apply(console, args);
            const str = args.map(a => String(a || '')).join(' ').toLowerCase();
            if (str.includes('quota exceeded') || str.includes('resource-exhausted')) {
                SystemSettingsManager.showQuotaExceededModal(
                    'Firebase Firestore',
                    'Daily read/write operation quota exceeded. Write operations are temporarily blocked until reset.'
                );
            }
        };
    }
}

// Auto-activate global interceptor
SystemSettingsManager.setupGlobalQuotaInterceptor();

