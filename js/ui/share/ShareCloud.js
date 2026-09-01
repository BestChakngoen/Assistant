import { ShareUI } from './ShareUI.js';

export class ShareCloud {
    static async detectMode(shareManager) {
        if (shareManager.supabase) {
            shareManager.mode = 'online';
            if (shareManager.dom.syncStatusText) shareManager.dom.syncStatusText.innerText = 'CLOUD SYNC ACTIVE';
            if (shareManager.dom.syncStatus) {
                shareManager.dom.syncStatus.className = 'px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400';
                const dot = shareManager.dom.syncStatus.querySelector('span');
                if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse';
            }

            if (shareManager.dom.hostUrlDisplay) {
                shareManager.dom.hostUrlDisplay.innerText = shareManager.hostUrl;
            }

            this.setupRealtime(shareManager);
        } else {
            this.setStandaloneMode(shareManager);
        }

        ShareUI.generateQRCode(shareManager.dom.qrContainer, shareManager.hostUrl);
    }

    static setStandaloneMode(shareManager) {
        shareManager.mode = 'standalone';
        shareManager.hostUrl = (typeof window !== 'undefined' && window.location) ? window.location.href : 'http://localhost:8888';
        
        if (shareManager.dom.syncStatusText) shareManager.dom.syncStatusText.innerText = 'STANDALONE MODE (OFFLINE)';
        if (shareManager.dom.syncStatus) {
            shareManager.dom.syncStatus.className = 'px-3.5 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400';
            const dot = shareManager.dom.syncStatus.querySelector('span');
            if (dot) dot.className = 'w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse';
        }
        
        if (shareManager.dom.hostUrlDisplay) {
            shareManager.dom.hostUrlDisplay.innerText = 'STANDALONE - ONLY PERSISTS LOCALLY';
        }
    }

    static setupRealtime(shareManager) {
        if (shareManager.channel) shareManager.supabase.removeChannel(shareManager.channel);

        shareManager.channel = shareManager.supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'shared_items' },
                (payload) => {
                    console.log('Realtime change received:', payload);
                    const uid = shareManager.currentUserId;
                    const itemUserId = (payload.new && payload.new.user_id) || (payload.old && payload.old.user_id);
                    if (uid && uid !== 'guest' && itemUserId && itemUserId !== uid) {
                        return; // Ignore events from other users
                    }

                    if (payload.eventType === 'INSERT') {
                        if (!shareManager.items.some(item => item.id === payload.new.id)) {
                            shareManager.items.unshift(payload.new);
                            shareManager.renderFeed();
                        }
                    } else if (payload.eventType === 'DELETE') {
                        shareManager.items = shareManager.items.filter(item => item.id !== payload.old.id);
                        shareManager.renderFeed();
                    } else if (payload.eventType === 'UPDATE') {
                        const idx = shareManager.items.findIndex(item => item.id === payload.new.id);
                        if (idx !== -1) {
                            shareManager.items[idx] = payload.new;
                            shareManager.renderFeed();
                        }
                    }
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
            });
    }

    static async updateStorageEstimate(shareManager) {
        if (shareManager.mode === 'online' && shareManager.supabase) {
            if (shareManager.dom.storageIndicator) shareManager.dom.storageIndicator.classList.add('hidden');
            if (shareManager.dom.cloudIndicator) shareManager.dom.cloudIndicator.classList.remove('hidden');

            try {
                let { data: fileList, error } = await shareManager.supabase
                    .storage
                    .from('shared-files')
                    .list();

                if (error) throw error;

                const activeFileNames = new Set(
                    shareManager.items
                        .filter(i => i.type === 'file')
                        .map(i => i.uniqueFilename || (i.url ? i.url.split('/').pop() : i.filename))
                        .filter(Boolean)
                );

                const orphanFiles = (fileList || [])
                    .map(f => f.name)
                    .filter(name => name && !activeFileNames.has(name));

                if (orphanFiles.length > 0) {
                    console.log('Cleaning up orphan Cloud Storage files:', orphanFiles);
                    await shareManager.supabase.storage.from('shared-files').remove(orphanFiles);
                    const { data: cleanList } = await shareManager.supabase.storage.from('shared-files').list();
                    if (cleanList) fileList = cleanList;
                }

                const totalBytes = (fileList || []).reduce((acc, file) => acc + (file.metadata?.size || 0), 0);
                const cloudQuotaBytes = 1024 * 1024 * 1024;
                const percentage = parseFloat(((totalBytes / cloudQuotaBytes) * 100).toFixed(2));

                if (shareManager.dom.cloudUsageText) {
                    shareManager.dom.cloudUsageText.innerText = `${ShareUI.formatSize(totalBytes)} / ${ShareUI.formatSize(cloudQuotaBytes)} (${percentage}%)`;
                }

                if (shareManager.dom.cloudUsageBar) {
                    shareManager.dom.cloudUsageBar.style.width = `${percentage}%`;
                    if (percentage > 90) {
                        shareManager.dom.cloudUsageBar.className = 'bg-gradient-to-r from-red-500 to-rose-600 h-1.5 rounded-full transition-all duration-500';
                    } else if (percentage > 70) {
                        shareManager.dom.cloudUsageBar.className = 'bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-500';
                    } else {
                        shareManager.dom.cloudUsageBar.className = 'bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full transition-all duration-500';
                    }
                }
            } catch (err) {
                console.warn('Failed to calculate Supabase storage size:', err);
                if (shareManager.dom.cloudUsageText) {
                    shareManager.dom.cloudUsageText.innerText = 'Unable to fetch cloud usage';
                }
            }
        } else {
            if (shareManager.dom.cloudIndicator) shareManager.dom.cloudIndicator.classList.add('hidden');

            if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
                try {
                    const estimate = await navigator.storage.estimate();
                    const usage = estimate.usage || 0;
                    const quota = estimate.quota || 0;
                    
                    const percentage = quota > 0 ? parseFloat(((usage / quota) * 100).toFixed(2)) : 0;
                    
                    if (shareManager.dom.storageUsageText) {
                        shareManager.dom.storageUsageText.innerText = `${ShareUI.formatSize(usage)} / ${ShareUI.formatSize(quota)} (${percentage}%)`;
                    }
                    
                    if (shareManager.dom.storageUsageBar) {
                        shareManager.dom.storageUsageBar.style.width = `${percentage}%`;
                        
                        if (percentage > 90) {
                            shareManager.dom.storageUsageBar.className = 'bg-gradient-to-r from-red-500 to-rose-600 h-1.5 rounded-full transition-all duration-500';
                        } else if (percentage > 70) {
                            shareManager.dom.storageUsageBar.className = 'bg-gradient-to-r from-amber-500 to-orange-500 h-1.5 rounded-full transition-all duration-500';
                        } else {
                            shareManager.dom.storageUsageBar.className = 'bg-gradient-to-r from-cyan-500 to-blue-500 h-1.5 rounded-full transition-all duration-500';
                        }
                    }
                    
                    if (shareManager.dom.storageIndicator) {
                        shareManager.dom.storageIndicator.classList.remove('hidden');
                    }
                } catch (e) {
                    console.warn('Storage estimate API failed:', e);
                    if (shareManager.dom.storageIndicator) {
                        shareManager.dom.storageIndicator.classList.add('hidden');
                    }
                }
            } else {
                if (shareManager.dom.storageIndicator) {
                    shareManager.dom.storageIndicator.classList.add('hidden');
                }
            }
        }
    }
}
