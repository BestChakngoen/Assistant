/**
 * ShareLightbox.js - Fullscreen Image Lightbox Modal with Zoom & Pan Gestures
 * Handles wheel zoom, touch pinch-to-zoom, mouse drag panning, keyboard shortcuts, and download.
 */
export class ShareLightbox {
    static showImageModal(imageUrl, filename = 'Image', callbacks = {}) {
        const playSound = callbacks.playSound || (() => {});
        const downloadFile = callbacks.downloadFile || (() => {});

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
                        <button id="btn-download-lightbox" class="p-2 rounded-xl bg-slate-800/80 hover:bg-cyan-600 text-slate-200 hover:text-white transition-all flex items-center gap-1.5 text-xs font-mono cursor-pointer" title="Download Image">
                            <i data-lucide="download" class="size-4"></i>
                            <span class="hidden sm:inline">Download</span>
                        </button>
                        <button id="btn-close-lightbox" class="size-9 rounded-xl bg-slate-800/80 hover:bg-red-500/80 text-slate-300 hover:text-white transition-all flex items-center justify-center cursor-pointer" title="Close (Esc)">
                            <i data-lucide="x" class="size-5"></i>
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
                    <span class="share-lightbox-zoom-level tabular-nums" id="lightbox-zoom-level">100%</span>
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
                    <button id="btn-error-download" class="mt-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition flex items-center gap-2 cursor-pointer">
                        <i data-lucide="download" class="w-4 h-4"></i> Download File Directly
                    </button>
                </div>
            `;
            const btnErrorDl = bodyEl.querySelector('#btn-error-download');
            if (btnErrorDl) {
                btnErrorDl.onclick = () => downloadFile(imageUrl, filename);
            }
            if (window.lucide) window.lucide.createIcons();
        };

        requestAnimationFrame(() => {
            overlay.classList.add('share-lightbox-visible');
        });

        // ── Close ──
        const close = () => {
            playSound('mouse-click');
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
        const btnDownload = overlay.querySelector('#btn-download-lightbox');
        if (btnDownload) {
            btnDownload.onclick = () => downloadFile(imageUrl, filename);
        }
        overlay.querySelector('#btn-close-lightbox').onclick = close;
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        playSound('mouse-click');
        applyTransform();
    }
}
