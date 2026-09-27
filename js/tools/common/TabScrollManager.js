/**
 * TabScrollManager.js - Reusable Horizontal Tab Scroll & Drag Controller
 * 
 * Provides smooth mouse drag-to-scroll, wheel horizontal navigation,
 * and smart auto-scroll into view for multi-sheet tabs (e.g. Quick Note and Freeform Data Table).
 * Adheres strictly to SOLID, Single Responsibility Principle (SRP), and Zero Regression.
 */
export class TabScrollManager {
    /**
     * @param {Object} options
     * @param {HTMLElement} options.scrollContainer - The outer scrollable wrapper element (overflow-x-auto)
     * @param {HTMLElement} [options.tabsContainer] - The inner flex container holding tab elements
     * @param {number} [options.threshold=5] - Pixel movement threshold to differentiate between click and drag
     * @param {number} [options.padding=20] - Padding in pixels when auto-scrolling an element into view
     */
    constructor({ scrollContainer, tabsContainer = null, threshold = 5, padding = 20 } = {}) {
        this.scrollContainer = scrollContainer;
        this.tabsContainer = tabsContainer || scrollContainer;
        this.threshold = threshold;
        this.padding = padding;

        this.isMouseDown = false;
        this.isDragging = false;
        this.startX = 0;
        this.initialScrollLeft = 0;

        // Bound listeners for precise registration and cleanup
        this._onMouseDown = this.onMouseDown.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onMouseUp = this.onMouseUp.bind(this);
        this._onWheel = this.onWheel.bind(this);

        this.initialized = false;
    }

    /**
     * Initializes event listeners on the scroll container and window.
     */
    init() {
        if (!this.scrollContainer || this.initialized) return;

        this.scrollContainer.addEventListener('mousedown', this._onMouseDown);
        this.scrollContainer.addEventListener('wheel', this._onWheel, { passive: false });
        window.addEventListener('mousemove', this._onMouseMove, { passive: false });
        window.addEventListener('mouseup', this._onMouseUp);

        this.initialized = true;
    }

    /**
     * Handles mousedown event to initiate drag tracking.
     * @param {MouseEvent} e
     */
    onMouseDown(e) {
        // Only accept primary (left) mouse click
        if (e.button !== 0) return;

        // Do not drag if initiated on interactive form elements like input or textarea
        if (e.target.closest('input, textarea, select')) return;

        this.isMouseDown = true;
        this.isDragging = false;
        this.startX = e.clientX;
        this.initialScrollLeft = this.scrollContainer.scrollLeft;
    }

    /**
     * Handles mousemove event across the window.
     * @param {MouseEvent} e
     */
    onMouseMove(e) {
        if (!this.isMouseDown || !this.scrollContainer) return;

        const dx = e.clientX - this.startX;

        // Check if movement exceeds threshold before entering drag state
        if (!this.isDragging) {
            if (Math.abs(dx) < this.threshold) return;

            this.isDragging = true;
            this.scrollContainer.classList.add('is-dragging', 'cursor-grabbing');
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'grabbing';
        }

        if (this.isDragging) {
            e.preventDefault();
            this.scrollContainer.scrollLeft = this.initialScrollLeft - dx;
        }
    }

    /**
     * Handles mouseup event to conclude dragging and suppress accidental clicks.
     */
    onMouseUp() {
        if (!this.isMouseDown) return;

        const wasDragging = this.isDragging;

        this.isMouseDown = false;
        this.isDragging = false;

        if (this.scrollContainer) {
            this.scrollContainer.classList.remove('is-dragging', 'cursor-grabbing');
        }
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        // If the gesture was a drag, suppress the subsequent click event on children (tabs/buttons)
        if (wasDragging) {
            const suppressClick = (e) => {
                e.stopImmediatePropagation();
                e.preventDefault();
                window.removeEventListener('click', suppressClick, true);
            };
            window.addEventListener('click', suppressClick, true);
            setTimeout(() => {
                window.removeEventListener('click', suppressClick, true);
            }, 120);
        }
    }

    /**
     * Handles mouse wheel for smooth horizontal scrolling on PC.
     * @param {WheelEvent} e
     */
    onWheel(e) {
        if (!this.scrollContainer) return;

        // If deltaX is present (trackpad or tilt wheel), let native browser horizontal scrolling work
        if (e.deltaX !== 0) return;

        if (e.deltaY !== 0) {
            // Check if container can actually scroll horizontally
            const canScrollLeft = this.scrollContainer.scrollLeft > 0;
            const canScrollRight = this.scrollContainer.scrollLeft < (this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth - 1);

            if ((e.deltaY < 0 && canScrollLeft) || (e.deltaY > 0 && canScrollRight)) {
                e.preventDefault();
                this.scrollContainer.scrollLeft += e.deltaY;
            }
        }
    }

    /**
     * Smoothly scrolls the specified tab element or selector into view within the horizontal container.
     * Guarantees zero vertical page jump.
     * @param {HTMLElement|string} target
     */
    scrollToTab(target) {
        if (!this.scrollContainer) return;

        let tabEl = null;
        if (typeof target === 'string') {
            tabEl = this.scrollContainer.querySelector(target);
        } else if (target instanceof HTMLElement) {
            tabEl = target;
        }

        if (!tabEl) return;

        const containerRect = this.scrollContainer.getBoundingClientRect();
        const tabRect = tabEl.getBoundingClientRect();

        // Check if tab is clipped on the left
        if (tabRect.left < containerRect.left) {
            const diff = containerRect.left - tabRect.left + this.padding;
            this.scrollContainer.scrollTo({
                left: Math.max(0, this.scrollContainer.scrollLeft - diff),
                behavior: 'smooth'
            });
        }
        // Check if tab is clipped on the right
        else if (tabRect.right > containerRect.right) {
            const diff = tabRect.right - containerRect.right + this.padding;
            const maxScroll = this.scrollContainer.scrollWidth - this.scrollContainer.clientWidth;
            this.scrollContainer.scrollTo({
                left: Math.min(maxScroll, this.scrollContainer.scrollLeft + diff),
                behavior: 'smooth'
            });
        }
    }

    /**
     * Helper to scroll active tab into view.
     * @param {string} selector
     */
    scrollToActiveTab(selector) {
        requestAnimationFrame(() => {
            this.scrollToTab(selector);
        });
    }

    /**
     * Cleans up all bound event listeners.
     */
    destroy() {
        if (!this.initialized) return;

        if (this.scrollContainer) {
            this.scrollContainer.removeEventListener('mousedown', this._onMouseDown);
            this.scrollContainer.removeEventListener('wheel', this._onWheel);
            this.scrollContainer.classList.remove('is-dragging', 'cursor-grabbing');
        }

        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('mouseup', this._onMouseUp);

        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        this.initialized = false;
    }
}
