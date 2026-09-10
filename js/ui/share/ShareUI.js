import { ShareLightbox } from './ShareLightbox.js';

export class ShareUI {
    static formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) + ' | ' + date.toLocaleDateString('en-US');
    }

    static playSound(name) {
        try {
            const sounds = {
                success: 'assets/Sounds/success.mp3',
                remove: 'assets/Sounds/remove.mp3',
                fail: 'assets/Sounds/fail.mp3',
                'mouse-click': 'assets/Sounds/mouse-click.mp3'
            };
            if (sounds[name]) {
                const audio = new Audio(sounds[name]);
                audio.play().catch(() => {});
            }
        } catch (e) {}
    }

    static generateQRCode(container, text) {
        if (!container) return;
        container.innerHTML = '';
        
        if (typeof window !== 'undefined' && window.QRCode) {
            try {
                new window.QRCode(container, {
                    text: text,
                    width: 140,
                    height: 140,
                    colorDark: "#080b11",
                    colorLight: "#ffffff",
                    correctLevel: window.QRCode.CorrectLevel.H
                });
            } catch (e) {
                console.error('QR Code generation failed:', e);
                container.innerHTML = '<span class="text-xs text-red-400">QR Generation Error</span>';
            }
        } else {
            container.innerHTML = '<span class="text-xs text-slate-400 font-mono">QRCode.js is not loaded</span>';
        }
    }

    static showToast(title, message, type = 'error') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-2.5 max-w-md w-full pointer-events-none px-4';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        
        let icon = 'check-circle';
        let iconColor = 'text-emerald-400';
        let bgIcon = 'bg-emerald-500/15';

        if (type === 'error') {
            icon = 'alert-circle';
            iconColor = 'text-rose-400';
            bgIcon = 'bg-rose-500/15';
        } else if (type === 'warning') {
            icon = 'alert-triangle';
            iconColor = 'text-amber-400';
            bgIcon = 'bg-amber-500/15';
        } else if (type === 'info') {
            icon = 'info';
            iconColor = 'text-cyan-400';
            bgIcon = 'bg-cyan-500/15';
        }

        toast.className = 'pointer-events-auto w-full sm:w-auto min-w-[320px] max-w-md bg-slate-900/95 backdrop-blur-md p-3.5 rounded-2xl shadow-2xl shadow-black/60 flex items-start gap-3 transition-all duration-300 transform -translate-y-6 scale-95 opacity-0';

        toast.innerHTML = `
            <div class="p-2 rounded-xl ${bgIcon} ${iconColor} shrink-0">
                <i data-lucide="${icon}" class="w-4 h-4"></i>
            </div>
            <div class="flex-1 min-w-0 pt-0.5">
                <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">${title}</h4>
                <p class="text-xs text-slate-300 mt-0.5 leading-relaxed font-sans">${message}</p>
            </div>
            <button class="text-slate-500 hover:text-slate-300 transition-colors p-1 shrink-0" title="Close">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
        `;

        const closeBtn = toast.querySelector('button');
        const dismiss = () => {
            toast.classList.add('-translate-y-6', 'scale-95', 'opacity-0');
            setTimeout(() => toast.remove(), 250);
        };

        if (closeBtn) closeBtn.onclick = dismiss;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        requestAnimationFrame(() => {
            toast.classList.remove('-translate-y-6', 'scale-95', 'opacity-0');
            toast.classList.add('translate-y-0', 'scale-100', 'opacity-100');
        });

        setTimeout(dismiss, 3500);
    }

    static showConfirmModal(options) {
        return new Promise((resolve) => {
            const existing = document.getElementById('share-confirm-modal');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'share-confirm-modal';
            overlay.className = 'share-overlay';
            overlay.innerHTML = `
                <div class="share-modal-card">
                    <div class="share-modal-body">
                        <div class="share-modal-icon-badge ${options.iconColor || 'text-red-400'}">
                            <i data-lucide="${options.icon || 'alert-triangle'}" class="w-8 h-8"></i>
                        </div>
                        <h3 class="share-modal-title">${options.title || 'Confirm Action'}</h3>
                        <p class="share-modal-message">${options.message || 'Are you sure?'}</p>
                        <div class="share-modal-divider"></div>
                        <div class="share-modal-actions">
                            <button id="btn-confirm-cancel" class="share-modal-btn share-modal-btn-cancel">
                                Cancel
                            </button>
                            <button id="btn-confirm-ok" class="share-modal-btn share-modal-btn-confirm ${options.confirmClass || 'bg-red-500 hover:bg-red-400 text-white'} shadow-lg shadow-red-500/20">
                                ${options.confirmLabel || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            if (window.lucide) window.lucide.createIcons();

            requestAnimationFrame(() => {
                overlay.classList.add('share-overlay-visible');
                const card = overlay.querySelector('.share-modal-card');
                if (card) card.classList.add('share-modal-card-visible');
            });

            const close = (result) => {
                this.playSound('mouse-click');
                overlay.classList.remove('share-overlay-visible');
                const card = overlay.querySelector('.share-modal-card');
                if (card) card.classList.remove('share-modal-card-visible');
                setTimeout(() => { overlay.remove(); resolve(result); }, 200);
            };

            const btnCancel = overlay.querySelector('#btn-confirm-cancel');
            const btnOk = overlay.querySelector('#btn-confirm-ok');
            btnCancel.onclick = () => close(false);
            btnOk.onclick = () => close(true);
        });
    }

    static showAlertModal(options = {}) {
        return new Promise((resolve) => {
            const existing = document.getElementById('share-alert-modal');
            if (existing) existing.remove();

            const overlay = document.createElement('div');
            overlay.id = 'share-alert-modal';
            overlay.className = 'share-overlay';
            overlay.innerHTML = `
                <div class="share-modal-card">
                    <div class="share-modal-body">
                        <div class="share-modal-icon-badge ${options.iconColor || 'text-cyan-400'}">
                            <i data-lucide="${options.icon || 'alert-circle'}" class="w-8 h-8"></i>
                        </div>
                        <h3 class="share-modal-title">${options.title || 'Information Required'}</h3>
                        <p class="share-modal-message">${options.message || 'Please enter text content before sending.'}</p>
                        <div class="share-modal-divider"></div>
                        <div class="share-modal-actions">
                            <button id="btn-share-alert-ok" class="share-modal-btn share-modal-btn-confirm ${options.confirmClass || 'bg-cyan-600 hover:bg-cyan-500 text-white'} w-full py-2.5 rounded-xl font-bold font-mono text-xs cursor-pointer">
                                ${options.confirmLabel || 'OK'}
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
            if (window.lucide) window.lucide.createIcons();

            requestAnimationFrame(() => {
                overlay.classList.add('share-overlay-visible');
                const card = overlay.querySelector('.share-modal-card');
                if (card) card.classList.add('share-modal-card-visible');
            });

            const close = () => {
                this.playSound('mouse-click');
                overlay.classList.remove('share-overlay-visible');
                const card = overlay.querySelector('.share-modal-card');
                if (card) card.classList.remove('share-modal-card-visible');
                setTimeout(() => { overlay.remove(); resolve(true); }, 200);
            };

            const btnOk = overlay.querySelector('#btn-share-alert-ok');
            if (btnOk) btnOk.onclick = close;
            overlay.onclick = (e) => {
                if (e.target === overlay) close();
            };
        });
    }

    static async downloadFileToDevice(url, filename, blob) {
        this.playSound('mouse-click');
        try {
            let fileBlob = blob;
            if (!fileBlob && url) {
                const res = await fetch(url);
                if (res.ok) fileBlob = await res.blob();
            }

            if (fileBlob) {
                const file = new File([fileBlob], filename || 'download', { type: fileBlob.type });

                // Try Web Share API on supported mobile browsers
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            files: [file],
                            title: filename || 'Download File'
                        });
                        return;
                    } catch (shareErr) {
                        if (shareErr.name !== 'AbortError') console.warn('Share API notice:', shareErr);
                    }
                }

                // Trigger blob download for mobile / desktop
                const blobUrl = URL.createObjectURL(fileBlob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename || 'download';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    a.remove();
                    URL.revokeObjectURL(blobUrl);
                }, 1000);
                return;
            }
        } catch (e) {
            console.warn('Direct blob fetch notice:', e);
        }

        // Direct anchor download fallback
        if (url) {
            const a = document.createElement('a');
            a.href = url;
            a.download = filename || 'download';
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            setTimeout(() => a.remove(), 1000);
        }
    }

    static showLoadingModal(shareManager, title, message, onCancel = null) {
        this.hideLoadingModal(shareManager);
        const overlay = document.createElement('div');
        overlay.id = 'share-loading-overlay';
        overlay.className = 'share-overlay share-overlay-visible';
        overlay.innerHTML = `
            <div class="share-modal-card share-modal-card-visible">
                <button id="btn-cancel-loading-modal" title="Cancel Upload" type="button"
                    style="position: absolute !important; top: 14px !important; right: 14px !important; left: auto !important;"
                    class="text-slate-400 hover:text-red-400 hover:bg-slate-800/80 p-2 rounded-full transition-colors z-20 flex items-center justify-center cursor-pointer">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <div class="share-modal-body">
                    <div class="share-spinner-badge">
                        <div class="w-10 h-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin"></div>
                    </div>
                    <h3 class="share-modal-title">${title}</h3>
                    <p class="share-modal-message">${message}</p>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        shareManager._loadingModalStartTime = Date.now();

        const btnCancel = overlay.querySelector('#btn-cancel-loading-modal');
        if (btnCancel) {
            btnCancel.onclick = () => {
                if (typeof onCancel === 'function') onCancel();
                this.hideLoadingModal(shareManager);
            };
        }
    }

    static async hideLoadingModal(shareManager) {
        const overlay = document.getElementById('share-loading-overlay');
        if (overlay) {
            const elapsed = Date.now() - (shareManager._loadingModalStartTime || 0);
            if (elapsed < 500) {
                await new Promise(r => setTimeout(r, 500 - elapsed));
            }
            overlay.classList.remove('share-overlay-visible');
            const card = overlay.querySelector('.share-modal-card');
            if (card) card.classList.remove('share-modal-card-visible');
            setTimeout(() => overlay.remove(), 200);
        }
    }

    static showImageModal(imageUrl, filename = 'Image') {
        return ShareLightbox.showImageModal(imageUrl, filename, {
            playSound: (name) => this.playSound(name),
            downloadFile: (url, fn) => this.downloadFileToDevice(url, fn)
        });
    }
}
