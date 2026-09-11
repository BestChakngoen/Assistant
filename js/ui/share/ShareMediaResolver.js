/**
 * ShareMediaResolver.js - Media URL Resolution & Supabase Storage Fallback Handler
 * Resolves local Blobs, base64 data, signed URLs, and handles blocked/failed image fallbacks.
 */
import { ShareUI } from './ShareUI.js';

export class ShareMediaResolver {
    static resolveFileUrl(item, shareManager) {
        let fileUrl = '';
        if (item.blob) {
            try { fileUrl = URL.createObjectURL(item.blob); } catch (e) {}
        }
        if (!fileUrl && item.base64Data) {
            fileUrl = item.base64Data;
        }
        if (!fileUrl && item.url) {
            const hostUrl = shareManager.hostUrl || '';
            if (shareManager.mode === 'online' && hostUrl && item.url.startsWith('/')) {
                fileUrl = hostUrl.replace(/\/+$/, '') + item.url;
            } else {
                fileUrl = item.url;
            }
        }

        // Defensive guard: reject invalid or corrupted URL strings
        if (fileUrl) {
            const trimmed = fileUrl.trim().toLowerCase();
            if (
                trimmed === 'invalid' ||
                trimmed === 'invalid/' ||
                trimmed.startsWith('invalid/') ||
                trimmed === 'undefined' ||
                trimmed === 'null'
            ) {
                return '';
            }
        }

        return fileUrl;
    }

    static initSignedUrl(item, shareManager) {
        if (shareManager.mode !== 'online' || !shareManager.supabase || item.blob || item.base64Data) return;

        let path = item.uniqueFilename;
        if (!path && item.url) {
            try {
                const urlObj = new URL(item.url);
                const parts = urlObj.pathname.split('/shared-files/');
                if (parts.length > 1) path = decodeURIComponent(parts[1]);
                else path = urlObj.pathname.split('/').pop();
            } catch (e) {
                path = item.url.split('/').pop();
            }
        }
        if (!path) path = item.filename;

        if (path) {
            shareManager.supabase.storage.from('shared-files').createSignedUrl(path, 315360000).then(res => {
                if (res.data?.signedUrl) {
                    const cardEl = document.querySelector(`[data-item-id="${item.id}"]`);
                    if (cardEl) {
                        const imgEl = cardEl.querySelector('img');
                        const imgWrapperEl = cardEl.querySelector('.group\\/img');
                        if (imgEl) imgEl.src = res.data.signedUrl;
                        if (imgWrapperEl) {
                            imgWrapperEl.onclick = (e) => {
                                e.stopPropagation();
                                ShareUI.playSound('mouse-click');
                                ShareUI.showImageModal(res.data.signedUrl, item.filename || 'Shared Image');
                            };
                        }
                    }
                }
            }).catch(() => {});
        }
    }

    static async handleImageFallback(img, imgWrapper, item, shareManager) {
        // 1. Fallback: local blob
        if (item.blob && (item.blob instanceof Blob || item.blob instanceof File)) {
            try {
                const fallbackBlobUrl = URL.createObjectURL(item.blob);
                if (img.src !== fallbackBlobUrl) {
                    img.src = fallbackBlobUrl;
                    imgWrapper.onclick = (e) => {
                        e.stopPropagation();
                        ShareUI.playSound('mouse-click');
                        ShareUI.showImageModal(fallbackBlobUrl, item.filename || 'Shared Image');
                    };
                    return;
                }
            } catch (e) {}
        }

        // 2. Fallback: base64
        if (item.base64Data && img.src !== item.base64Data) {
            img.src = item.base64Data;
            imgWrapper.onclick = (e) => {
                e.stopPropagation();
                ShareUI.playSound('mouse-click');
                ShareUI.showImageModal(item.base64Data, item.filename || 'Shared Image');
            };
            return;
        }

        // 3. Fallback: Supabase direct blob download
        if (shareManager.mode === 'online' && shareManager.supabase) {
            try {
                let path = item.uniqueFilename;
                if (!path && item.url) {
                    try {
                        const urlObj = new URL(item.url);
                        const parts = urlObj.pathname.split('/shared-files/');
                        if (parts.length > 1) path = decodeURIComponent(parts[1]);
                        else path = urlObj.pathname.split('/').pop();
                    } catch (e) { path = item.url.split('/').pop(); }
                }
                if (!path) path = item.filename;

                if (path) {
                    const res = await shareManager.supabase.storage.from('shared-files').download(path);
                    const blobData = res.data;
                    const dlErr = res.error;

                    if (dlErr || !blobData) {
                        const { data: signedData } = await shareManager.supabase.storage.from('shared-files').createSignedUrl(path, 3600);
                        if (signedData?.signedUrl && img.src !== signedData.signedUrl) {
                            img.src = signedData.signedUrl;
                            imgWrapper.onclick = (e) => {
                                e.stopPropagation();
                                ShareUI.playSound('mouse-click');
                                ShareUI.showImageModal(signedData.signedUrl, item.filename || 'Shared Image');
                            };
                            return;
                        }
                    }

                    if (!dlErr && blobData) {
                        item.blob = blobData;
                        const downloadedBlobUrl = URL.createObjectURL(blobData);
                        img.src = downloadedBlobUrl;
                        imgWrapper.onclick = (e) => {
                            e.stopPropagation();
                            ShareUI.playSound('mouse-click');
                            ShareUI.showImageModal(downloadedBlobUrl, item.filename || 'Shared Image');
                        };
                        return;
                    }
                }
            } catch (storageErr) {
                console.warn('Supabase blob download fallback failed:', storageErr);
            }
        }

        // 4. Fallback: IndexedDB cached blob
        try {
            if (shareManager.dbStore && item.id) {
                const localRecord = await shareManager.dbStore.get(item.id);
                if (localRecord && localRecord.blob) {
                    const localBlobUrl = URL.createObjectURL(localRecord.blob);
                    img.src = localBlobUrl;
                    imgWrapper.onclick = (e) => {
                        e.stopPropagation();
                        ShareUI.playSound('mouse-click');
                        ShareUI.showImageModal(localBlobUrl, item.filename || 'Shared Image');
                    };
                    return;
                }
            }
        } catch (localErr) {}

        // 5. Final fallback: Error banner
        imgWrapper.className = 'p-3.5 bg-slate-950/80 border border-amber-500/30 rounded-xl flex items-center gap-3 text-amber-300 text-xs font-mono max-w-full';
        imgWrapper.onclick = null;
        imgWrapper.innerHTML = `
            <i data-lucide="shield-alert" class="w-5 h-5 text-amber-400 shrink-0"></i>
            <div class="min-w-0">
                <p class="font-bold text-slate-200 truncate">${item.filename || 'Image'}</p>
                <p class="text-[10px] text-amber-400/90 mt-0.5 leading-tight">Blocked by AdBlocker / Network (net::ERR_BLOCKED_BY_CLIENT). Disable extension or use Local Storage.</p>
            </div>
        `;
        if (window.lucide) window.lucide.createIcons();
    }
}
