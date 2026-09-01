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
        const existing = document.getElementById('share-image-modal');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'share-image-modal';
        overlay.className = 'share-lightbox-overlay';
        overlay.innerHTML = `
            <div class="share-lightbox-container">
                <div class="share-lightbox-header">
                    <div class="flex items-center gap-2 text-slate-200 text-xs font-mono font-bold truncate max-w-[60vw]">
                        <i data-lucide="image" class="w-4 h-4 text-cyan-400 shrink-0"></i>
                        <span class="truncate">${filename}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <a href="${imageUrl}" download="${filename}" class="p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-600 text-slate-200 hover:text-white transition-all border border-slate-700/60 flex items-center gap-1.5 text-xs font-mono" title="Download Image">
                            <i data-lucide="download" class="w-4 h-4"></i>
                            <span class="hidden sm:inline">Download</span>
                        </a>
                        <button id="btn-close-lightbox" class="p-2 rounded-xl bg-slate-800/80 hover:bg-red-500/80 text-slate-300 hover:text-white transition-all border border-slate-700/60" title="Close (Esc)">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                </div>
                <div class="share-lightbox-body zoom-default" id="lightbox-body">
                    <img src="${imageUrl}" alt="${filename}" class="share-lightbox-img" id="lightbox-img" />
                </div>
                <div class="share-lightbox-zoom-bar">
                    <button class="share-lightbox-zoom-btn" id="btn-zoom-out" title="Zoom Out (-)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                    </button>
                    <span class="share-lightbox-zoom-level" id="lightbox-zoom-level">100%</span>
                    <button class="share-lightbox-zoom-btn" id="btn-zoom-in" title="Zoom In (+)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
                    </button>
                    <div class="share-lightbox-zoom-sep"></div>
                    <button class="share-lightbox-zoom-btn" id="btn-zoom-reset" title="Reset (0)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();

        // ── Zoom / Pan state ──
        const MIN_SCALE = 0.5;
        const MAX_SCALE = 8;
        const STEP      = 0.25;
        let scale    = 1;
        let panX     = 0;
        let panY     = 0;
        let isDragging  = false;
        let dragStartX  = 0;
        let dragStartY  = 0;
        let lastPanX    = 0;
        let lastPanY    = 0;

        const imgEl     = overlay.querySelector('#lightbox-img');
        const bodyEl    = overlay.querySelector('#lightbox-body');
        const zoomLabel = overlay.querySelector('#lightbox-zoom-level');
        const btnIn     = overlay.querySelector('#btn-zoom-in');
        const btnOut    = overlay.querySelector('#btn-zoom-out');
        const btnReset  = overlay.querySelector('#btn-zoom-reset');

        function applyTransform(animate = false) {
            if (animate) {
                imgEl.classList.add('is-animating');
                setTimeout(() => imgEl.classList.remove('is-animating'), 320);
            }
            imgEl.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;

            const pct = Math.round(scale * 100);
            zoomLabel.textContent = pct + '%';

            if (scale > 1.005) {
                zoomLabel.classList.add('zoomed-in');
                bodyEl.classList.remove('zoom-default');
            } else {
                zoomLabel.classList.remove('zoomed-in');
                if (!isDragging) bodyEl.classList.add('zoom-default');
            }

            btnOut.disabled   = scale <= MIN_SCALE;
            btnIn.disabled    = scale >= MAX_SCALE;
            btnReset.disabled = (Math.abs(scale - 1) < 0.005 && Math.abs(panX) < 0.5 && Math.abs(panY) < 0.5);
        }

        function clampPan() {
            const bodyRect  = bodyEl.getBoundingClientRect();
            const renderedW = imgEl.offsetWidth  * scale;
            const renderedH = imgEl.offsetHeight * scale;
            const maxPanX   = Math.max(0, (renderedW - bodyRect.width)  / 2);
            const maxPanY   = Math.max(0, (renderedH - bodyRect.height) / 2);
            panX = Math.max(-maxPanX, Math.min(maxPanX, panX));
            panY = Math.max(-maxPanY, Math.min(maxPanY, panY));
        }

        function zoomTo(newScale, originX = 0, originY = 0, animate = false) {
            newScale    = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
            const ratio = newScale / scale;
            panX  = originX + (panX - originX) * ratio;
            panY  = originY + (panY - originY) * ratio;
            scale = newScale;
            clampPan();
            applyTransform(animate);
        }

        function resetView(animate = true) {
            scale = 1;
            panX  = 0;
            panY  = 0;
            applyTransform(animate);
        }

        // ── Scroll wheel zoom ──
        bodyEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            const rect    = bodyEl.getBoundingClientRect();
            const originX = e.clientX - rect.left - rect.width  / 2 - panX;
            const originY = e.clientY - rect.top  - rect.height / 2 - panY;
            const factor  = e.deltaY < 0 ? 1.12 : (1 / 1.12);
            zoomTo(scale * factor, originX, originY);
        }, { passive: false });

        // ── Pinch-to-zoom (touch) ──
        let lastTouchDist = null;

        bodyEl.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                lastTouchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
            } else if (e.touches.length === 1) {
                isDragging = true;
                dragStartX = e.touches[0].clientX - panX;
                dragStartY = e.touches[0].clientY - panY;
            }
        }, { passive: true });

        bodyEl.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length === 2 && lastTouchDist !== null) {
                const dist    = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const rect    = bodyEl.getBoundingClientRect();
                const midX    = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const midY    = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const originX = midX - rect.left - rect.width  / 2 - panX;
                const originY = midY - rect.top  - rect.height / 2 - panY;
                zoomTo(scale * (dist / lastTouchDist), originX, originY);
                lastTouchDist = dist;
            } else if (e.touches.length === 1 && isDragging && scale > 1) {
                panX = e.touches[0].clientX - dragStartX;
                panY = e.touches[0].clientY - dragStartY;
                clampPan();
                applyTransform();
            }
        }, { passive: false });

        bodyEl.addEventListener('touchend', () => {
            lastTouchDist = null;
            isDragging    = false;
        });

        // ── Mouse drag to pan ──
        const onMouseMove = (e) => {
            if (!isDragging) return;
            panX = lastPanX + (e.clientX - dragStartX);
            panY = lastPanY + (e.clientY - dragStartY);
            clampPan();
            applyTransform();
        };
        const onMouseUp = () => {
            if (!isDragging) return;
            isDragging = false;
            bodyEl.classList.remove('is-dragging');
            if (scale <= 1.005) bodyEl.classList.add('zoom-default');
        };

        bodyEl.addEventListener('mousedown', (e) => {
            if (scale <= 1.005) return;
            e.preventDefault();
            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            lastPanX   = panX;
            lastPanY   = panY;
            bodyEl.classList.add('is-dragging');
            bodyEl.classList.remove('zoom-default');
        });

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup',   onMouseUp);

        // ── Double-click: toggle fit ↔ 2× ──
        bodyEl.addEventListener('dblclick', (e) => {
            if (scale > 1.01) {
                resetView(true);
            } else {
                const rect    = bodyEl.getBoundingClientRect();
                const originX = e.clientX - rect.left - rect.width  / 2;
                const originY = e.clientY - rect.top  - rect.height / 2;
                zoomTo(2, originX, originY, true);
            }
        });

        // ── Toolbar buttons ──
        btnIn.onclick    = () => zoomTo(scale + STEP, 0, 0, true);
        btnOut.onclick   = () => zoomTo(scale - STEP, 0, 0, true);
        btnReset.onclick = () => resetView(true);

        // ── Image load error ──
        imgEl.onerror = () => {
            imgEl.style.display = 'none';
            bodyEl.innerHTML = `
                <div class="p-6 bg-slate-900/90 border border-amber-500/30 rounded-2xl flex flex-col items-center text-center gap-3 max-w-md">
                    <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <i data-lucide="shield-alert" class="w-6 h-6"></i>
                    </div>
                    <h4 class="text-sm font-mono font-bold text-white uppercase">Cloud Image Blocked / Failed</h4>
                    <p class="text-xs text-slate-400 leading-relaxed">
                        The browser or an extension (e.g., AdBlocker, uBlock, Brave Shield) blocked loading the cloud image URL.
                    </p>
                    <a href="${imageUrl}" download="${filename}" class="mt-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition flex items-center gap-2">
                        <i data-lucide="download" class="w-4 h-4"></i> Download File Directly
                    </a>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
        };

        requestAnimationFrame(() => {
            overlay.classList.add('share-lightbox-visible');
        });

        // ── Close ──
        const close = () => {
            this.playSound('mouse-click');
            overlay.classList.remove('share-lightbox-visible');
            document.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup',   onMouseUp);
            setTimeout(() => overlay.remove(), 220);
        };

        const onKeyDown = (e) => {
            if (e.key === 'Escape')                   { close(); return; }
            if (e.key === '=' || e.key === '+')       { e.preventDefault(); zoomTo(scale + STEP, 0, 0, true); }
            if (e.key === '-')                        { e.preventDefault(); zoomTo(scale - STEP, 0, 0, true); }
            if (e.key === '0')                        { e.preventDefault(); resetView(true); }
        };

        document.addEventListener('keydown', onKeyDown);
        overlay.querySelector('#btn-close-lightbox').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        this.playSound('mouse-click');
        applyTransform();
    }
}
