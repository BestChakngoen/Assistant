/**
 * ToolZoomManager.js - Reusable Zoom Controller with Keyboard & Wheel Shortcuts
 * Supports Ctrl+, Ctrl-, Ctrl 0, and Ctrl+Wheel zoom with LocalStorage persistence
 * and an elegant frameless floating toast indicator.
 * Adheres strictly to SOLID, Single Responsibility Principle (SRP), and Zero Regression.
 */

export class ToolZoomManager {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.container Section element to bind events and mount indicator
     * @param {string} options.storageKey Key for persisting zoom level in localStorage
     * @param {number} [options.minZoom=0.7] Minimum zoom ratio (e.g. 0.7 = 70%)
     * @param {number} [options.maxZoom=2.0] Maximum zoom ratio (e.g. 2.0 = 200%)
     * @param {number} [options.step=0.1] Zoom step increment (e.g. 0.1 = 10%)
     * @param {number} [options.defaultZoom=1.0] Default zoom ratio (1.0 = 100%)
     * @param {string} [options.accentColor='text-amber-400'] Tailwind color class for indicator
     * @param {Function} options.onZoomChange Callback when zoom level changes
     */
    constructor({
        container,
        storageKey,
        minZoom = 0.7,
        maxZoom = 2.0,
        step = 0.1,
        defaultZoom = 1.0,
        accentColor = 'text-amber-400',
        onZoomChange = null
    }) {
        this.container = container;
        this.storageKey = storageKey;
        this.minZoom = minZoom;
        this.maxZoom = maxZoom;
        this.step = step;
        this.defaultZoom = defaultZoom;
        this.accentColor = accentColor;
        this.onZoomChange = onZoomChange;

        this.zoomLevel = this.loadZoom();
        this.indicatorEl = null;
        this.fadeTimer = null;
        this.isMouseOver = false;

        this._onKeyDown = this.onKeyDown.bind(this);
        this._onWheel = this.onWheel.bind(this);
        this._onMouseEnter = () => { this.isMouseOver = true; };
        this._onMouseLeave = () => { this.isMouseOver = false; };
    }

    /**
     * Load persisted zoom level from localStorage
     */
    loadZoom() {
        if (!this.storageKey) return this.defaultZoom;
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved !== null) {
                const parsed = parseFloat(saved);
                if (!isNaN(parsed) && parsed >= this.minZoom && parsed <= this.maxZoom) {
                    return Math.round(parsed * 100) / 100;
                }
            }
        } catch (e) {
            // Fallback gracefully
        }
        return this.defaultZoom;
    }

    /**
     * Save zoom level to localStorage
     */
    saveZoom() {
        if (!this.storageKey) return;
        try {
            localStorage.setItem(this.storageKey, this.zoomLevel.toString());
        } catch (e) {
            // Ignore storage quota errors
        }
    }

    /**
     * Initialize event bindings and apply saved zoom level
     */
    init() {
        if (!this.container) return;

        // Track hover state on container
        this.container.addEventListener('mouseenter', this._onMouseEnter);
        this.container.addEventListener('mouseleave', this._onMouseLeave);

        // Intercept Ctrl+Wheel on container
        this.container.addEventListener('wheel', this._onWheel, { passive: false });

        // Capture keyboard shortcuts globally, filtering by section activity
        window.addEventListener('keydown', this._onKeyDown, { capture: true });

        // Apply initial zoom
        this.applyCurrentZoom();
    }

    /**
     * Check if the mouse is hovering over or keyboard focus is inside this section
     */
    isSectionActive() {
        if (!this.container) return false;
        if (this.isMouseOver) return true;
        if (document.activeElement && this.container.contains(document.activeElement)) return true;
        return false;
    }

    /**
     * Handle keydown shortcuts
     */
    onKeyDown(e) {
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;
        if (!isCtrlOrCmd) return;
        if (!this.isSectionActive()) return;

        const code = e.code;
        const key = e.key;

        // Zoom In: Ctrl + Plus / Ctrl + Equal
        const isZoomIn = code === 'Equal' || code === 'NumpadAdd' || key === '+' || key === '=';
        if (isZoomIn && !e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            this.zoomIn();
            return;
        }

        // Zoom Out: Ctrl + Minus
        const isZoomOut = code === 'Minus' || code === 'NumpadSubtract' || key === '-' || key === '_';
        if (isZoomOut && !e.altKey) {
            e.preventDefault();
            e.stopPropagation();
            this.zoomOut();
            return;
        }

        // Reset Zoom: Ctrl + 0
        const isReset = code === 'Digit0' || code === 'Numpad0' || key === '0';
        if (isReset && !e.altKey && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            this.resetZoom();
            return;
        }
    }

    /**
     * Handle Ctrl+Wheel zoom
     */
    onWheel(e) {
        const isCtrlOrCmd = e.ctrlKey || e.metaKey;
        if (!isCtrlOrCmd) return;

        e.preventDefault();
        e.stopPropagation();

        if (e.deltaY < 0) {
            this.zoomIn();
        } else if (e.deltaY > 0) {
            this.zoomOut();
        }
    }

    /**
     * Increment zoom level
     */
    zoomIn() {
        this.setZoom(Math.min(this.maxZoom, Math.round((this.zoomLevel + this.step) * 100) / 100));
    }

    /**
     * Decrement zoom level
     */
    zoomOut() {
        this.setZoom(Math.max(this.minZoom, Math.round((this.zoomLevel - this.step) * 100) / 100));
    }

    /**
     * Reset zoom to default (100%)
     */
    resetZoom() {
        this.setZoom(this.defaultZoom);
    }

    /**
     * Set explicit zoom level
     */
    setZoom(level, notify = true) {
        this.zoomLevel = Math.max(this.minZoom, Math.min(this.maxZoom, Math.round(level * 100) / 100));
        this.saveZoom();
        this.applyCurrentZoom();
        if (notify) {
            this.showIndicator();
        }
    }

    /**
     * Apply zoom to target via callback
     */
    applyCurrentZoom() {
        if (typeof this.onZoomChange === 'function') {
            this.onZoomChange(this.zoomLevel);
        }
    }

    /**
     * Create floating frameless indicator badge
     */
    createIndicator() {
        if (this.indicatorEl || !this.container) return;

        this.indicatorEl = document.createElement('div');
        this.indicatorEl.className = 'pointer-events-none absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/80 backdrop-blur-md shadow-2xl transition-all duration-200 opacity-0 translate-y-1';
        this.indicatorEl.innerHTML = `
            <svg class="size-3.5 shrink-0 ${this.accentColor}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <span class="text-xs font-mono font-bold ${this.accentColor} tabular-nums"></span>
        `;

        this.container.appendChild(this.indicatorEl);
    }

    /**
     * Display floating indicator badge and fade out after delay
     */
    showIndicator() {
        if (!this.indicatorEl) {
            this.createIndicator();
        }
        if (!this.indicatorEl) return;

        const span = this.indicatorEl.querySelector('span');
        if (span) {
            const percent = Math.round(this.zoomLevel * 100);
            span.textContent = `Zoom: ${percent}%`;
        }

        // Show indicator smoothly
        this.indicatorEl.classList.remove('opacity-0', 'translate-y-1');
        this.indicatorEl.classList.add('opacity-100', 'translate-y-0');

        if (this.fadeTimer) {
            clearTimeout(this.fadeTimer);
        }

        this.fadeTimer = setTimeout(() => {
            if (this.indicatorEl) {
                this.indicatorEl.classList.remove('opacity-100', 'translate-y-0');
                this.indicatorEl.classList.add('opacity-0', 'translate-y-1');
            }
        }, 1200);
    }

    /**
     * Cleanup event listeners
     */
    destroy() {
        if (!this.container) return;
        this.container.removeEventListener('mouseenter', this._onMouseEnter);
        this.container.removeEventListener('mouseleave', this._onMouseLeave);
        this.container.removeEventListener('wheel', this._onWheel);
        window.removeEventListener('keydown', this._onKeyDown, { capture: true });

        if (this.fadeTimer) {
            clearTimeout(this.fadeTimer);
        }
        if (this.indicatorEl && this.indicatorEl.parentNode) {
            this.indicatorEl.parentNode.removeChild(this.indicatorEl);
        }
        this.indicatorEl = null;
    }
}
