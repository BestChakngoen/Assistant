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
            container.className = 'fixed bottom-6 left-6 z-50 flex flex-col gap-3 max-w-sm w-full';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        const isError = type === 'error';
        
        toast.className = `glass-panel p-4 rounded-xl border ${
            isError ? 'border-red-500/30 bg-red-950/20' : 'border-green-500/30 bg-green-950/20'
        } bg-slate-950/80 shadow-2xl flex gap-3 items-start transition-all duration-300 transform translate-y-2 opacity-0`;

        const icon = isError ? 'alert-triangle' : 'check-circle';
        const iconColor = isError ? 'text-red-400' : 'text-green-400';

        toast.innerHTML = `
            <div class="p-1.5 rounded-lg bg-slate-900/60 ${iconColor} shrink-0">
                <i data-lucide="${icon}" class="w-5 h-5"></i>
            </div>
            <div class="flex-1 min-w-0">
                <h4 class="text-xs font-mono font-bold text-white uppercase tracking-wider">${title}</h4>
                <p class="text-xs text-slate-400 mt-1 leading-relaxed">${message}</p>
            </div>
            <button class="text-slate-500 hover:text-slate-350 transition-colors shrink-0" onclick="this.parentElement.remove()">
                <i data-lucide="x" class="w-3.5 h-3.5"></i>
            </button>
        `;

        container.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        requestAnimationFrame(() => {
            toast.classList.remove('translate-y-2', 'opacity-0');
        });

        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-2');
            setTimeout(() => toast.remove(), 300);
        }, 6000);
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

    static showLoadingModal(shareManager, title, message) {
        this.hideLoadingModal(shareManager);
        const overlay = document.createElement('div');
        overlay.id = 'share-loading-overlay';
        overlay.className = 'share-overlay share-overlay-visible';
        overlay.innerHTML = `
            <div class="share-modal-card share-modal-card-visible">
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
        shareManager._loadingModalStartTime = Date.now();
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
}
