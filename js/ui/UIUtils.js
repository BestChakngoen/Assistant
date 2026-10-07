export class UIUtils {
    /**
     * Initializes universal horizontal slide bars (.custom-slide-bar)
     * Handles horizontal mouse wheel scrolling, click-and-drag scrolling, and auto-hiding scrollbar
     */
    static setupCustomSlideBar(element) {
        if (!element || element.dataset.hasSlideBarInit) return;
        element.dataset.hasSlideBarInit = 'true';

        // Mouse Wheel Horizontal Scroll
        element.addEventListener('wheel', (e) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                element.scrollLeft += e.deltaY;
            }
        }, { passive: false });

        // Auto-hiding Scrollbar Indicator
        let scrollTimer;
        element.addEventListener('scroll', () => {
            element.classList.add('is-scrolling');
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                element.classList.remove('is-scrolling');
            }, 800);
        }, { passive: true });

        // Click-and-Drag Horizontal Scrolling (Mouse Drag)
        let isDown = false;
        let startX = 0;
        let scrollStart = 0;
        let hasMoved = false;

        const onMouseMove = (e) => {
            if (!isDown) return;
            const walk = e.clientX - startX;

            if (Math.abs(walk) > 5) {
                hasMoved = true;
                e.preventDefault();
                element.scrollLeft = scrollStart - walk;
            }
        };

        const onMouseUp = () => {
            if (!isDown) return;
            isDown = false;

            element.style.scrollBehavior = '';
            element.classList.remove('is-dragging');

            window.removeEventListener('mousemove', onMouseMove);

            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                element.classList.remove('is-scrolling');
            }, 800);

            // Prevent accidental button clicks when dragging
            if (hasMoved) {
                const captureClick = (e) => {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                };
                element.addEventListener('click', captureClick, { capture: true, once: true });
            }
        };

        const onMouseDown = (e) => {
            // Only handle primary (left) mouse button
            if (e.button !== 0) return;
            isDown = true;
            hasMoved = false;
            startX = e.clientX;
            scrollStart = element.scrollLeft;

            // Disable smooth scrolling temporarily for 1:1 crisp responsiveness
            element.style.scrollBehavior = 'auto';
            element.classList.add('is-dragging', 'is-scrolling');

            window.addEventListener('mousemove', onMouseMove, { passive: false });
            window.addEventListener('mouseup', onMouseUp, { once: true });
        };

        element.addEventListener('mousedown', onMouseDown);
    }
}
