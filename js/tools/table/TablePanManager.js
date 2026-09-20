/**
 * TablePanManager.js - Freeform Click-and-Drag Pan / Scroll Controller
 * Enables intuitive click-and-drag panning across the Freeform Data Table in both X and Y directions.
 * Differentiates between quick clicks (for text caret placement or editing) and drag gestures (> threshold).
 * Adheres strictly to SOLID, Single Responsibility Principle (SRP), and Zero Regression standards.
 */

export class TablePanManager {
    /**
     * @param {HTMLElement} scrollWrapper The scrollable container (#table-scroll-wrapper)
     * @param {Object} [options] Config options
     * @param {number} [options.threshold=5] Pixels to move before drag mode activates
     */
    constructor(scrollWrapper, options = {}) {
        this.scrollWrapper = scrollWrapper;
        this.threshold = options.threshold ?? 5;

        this.isMouseDown = false;
        this.isDragging = false;
        this.hasMovedPastThreshold = false;
        this.startX = 0;
        this.startY = 0;
        this.initialScrollLeft = 0;
        this.initialScrollTop = 0;

        // Bound event listeners for proper registration and cleanup
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseUp = this.onMouseUp.bind(this);
    }

    /**
     * Initialize event listeners
     */
    init() {
        if (!this.scrollWrapper) return;
        this.scrollWrapper.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mousemove', this._onMouseMove, { passive: false });
        window.addEventListener('mouseup', this._onMouseUp);
    }

    /**
     * Check if click coordinates land directly on the native scrollbar tracks/thumbs
     */
    isScrollbarClick(e) {
        if (!this.scrollWrapper) return false;
        const rect = this.scrollWrapper.getBoundingClientRect();
        const isVerticalScrollbar = (e.clientX >= rect.left + this.scrollWrapper.clientWidth) && (e.clientX <= rect.right);
        const isHorizontalScrollbar = (e.clientY >= rect.top + this.scrollWrapper.clientHeight) && (e.clientY <= rect.bottom);
        return isVerticalScrollbar || isHorizontalScrollbar;
    }

    /**
     * Handles mousedown event on scroll container
     */
    onMouseDown(e) {
        // Only accept Left click (button 0) or Middle wheel click (button 1)
        if (e.button !== 0 && e.button !== 1) return;

        // Don't hijack clicks on native scrollbars
        if (this.isScrollbarClick(e)) return;

        // For left click, let interactive action elements (buttons, links, native inputs) handle clicks directly
        if (e.button === 0) {
            const isInteractive = e.target.closest('button, a, input, select, textarea');
            if (isInteractive) return;
        }

        // Prevent browser middle-click autoscroll icon
        if (e.button === 1) {
            e.preventDefault();
        }

        this.isMouseDown = true;
        this.isDragging = false;
        this.hasMovedPastThreshold = false;
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.initialScrollLeft = this.scrollWrapper.scrollLeft;
        this.initialScrollTop = this.scrollWrapper.scrollTop;
    }

    /**
     * Handles mousemove event across window during mousedown
     */
    onMouseMove(e) {
        if (!this.isMouseDown) return;

        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;
        const dist = Math.hypot(dx, dy);

        // Activate drag once distance exceeds threshold
        if (!this.hasMovedPastThreshold) {
            if (dist < this.threshold) return;

            this.hasMovedPastThreshold = true;
            this.isDragging = true;

            // Clear any text selection that started prior to surpassing threshold
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }

            // If an editor had focus, blur it to prevent unwanted text highlighting
            if (document.activeElement && typeof document.activeElement.blur === 'function' && document.activeElement.getAttribute('contenteditable')) {
                document.activeElement.blur();
            }

            // Apply panning visual states
            this.scrollWrapper.classList.add('is-panning');
            document.body.style.cursor = 'grabbing';
            document.body.style.userSelect = 'none';
        }

        if (this.isDragging) {
            e.preventDefault();
            this.scrollWrapper.scrollLeft = this.initialScrollLeft - dx;
            this.scrollWrapper.scrollTop = this.initialScrollTop - dy;
        }
    }

    /**
     * Handles mouseup event to end drag gesture and cleanup states
     */
    onMouseUp() {
        if (!this.isMouseDown) return;

        const wasDragging = this.isDragging;

        this.isMouseDown = false;
        this.isDragging = false;
        this.hasMovedPastThreshold = false;

        this.scrollWrapper.classList.remove('is-panning');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';

        // If a drag operation was completed, suppress the synthetic click event on the drop target
        if (wasDragging) {
            const suppressClick = (clickEvent) => {
                clickEvent.stopImmediatePropagation();
                clickEvent.preventDefault();
                window.removeEventListener('click', suppressClick, true);
            };
            window.addEventListener('click', suppressClick, true);
            setTimeout(() => {
                window.removeEventListener('click', suppressClick, true);
            }, 100);
        }
    }

    /**
     * Cleanup and remove event listeners
     */
    destroy() {
        if (!this.scrollWrapper) return;
        this.scrollWrapper.removeEventListener('mousedown', this._onMouseDown);
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);

        this.scrollWrapper.classList.remove('is-panning');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        this.isMouseDown = false;
        this.isDragging = false;
    }
}
