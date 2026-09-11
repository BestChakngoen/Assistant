/**
 * PhonkMobileAdapter.js - Mobile Landscape, Fullscreen, Orientation Lock & Back Navigation Coordinator
 * Encapsulates mobile-specific game UX, orientation locking, fullscreen transitions, and History popstate handling.
 * Adheres strictly to OOP, SOLID, and clean code principles.
 */
export class PhonkMobileAdapter {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.gamePanel = document.getElementById('game-panel');
        this.pauseOverlay = document.getElementById('phonk-pause-overlay');
        this.exitBtn = document.getElementById('btn-exit-game');
        this.isActive = false;

        this.handlePopState = this.handlePopState.bind(this);
        this.handleExitClick = this.handleExitClick.bind(this);
        this.handleFullscreenChange = this.handleFullscreenChange.bind(this);

        this.init();
    }

    init() {
        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', this.handleExitClick);
        }

        window.addEventListener('popstate', this.handlePopState);
        document.addEventListener('fullscreenchange', this.handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);

        if (this.gameEngine) {
            this.gameEngine.onPauseChange = (isPaused) => {
                this.updatePauseOverlayVisibility(isPaused);
            };
        }
    }

    updatePauseOverlayVisibility(isPaused) {
        if (!this.pauseOverlay) return;

        if (this.isActive && isPaused) {
            this.pauseOverlay.classList.remove('hidden');
            this.pauseOverlay.classList.add('flex');
        } else {
            this.pauseOverlay.classList.add('hidden');
            this.pauseOverlay.classList.remove('flex');
        }
    }

    isMobileDevice() {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
        const isNarrow = window.innerWidth <= 1024;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return (isTouch && isNarrow) || isMobileUA;
    }

    async enterGame() {
        this.isActive = true;

        if (this.isMobileDevice()) {
            if (this.gamePanel) {
                this.gamePanel.classList.add('phonk-mobile-fullscreen');
            }

            // Push history state so mobile hardware/gesture back button exits game immediately to Trade Track
            try {
                if (!window.history.state || !window.history.state.inPhonkGame) {
                    window.history.pushState({ inPhonkGame: true }, '', '#game');
                }
            } catch (e) {
                console.warn('[PhonkMobileAdapter] Failed to push history state:', e);
            }

            // Lock screen orientation to landscape if supported
            try {
                if (screen.orientation && typeof screen.orientation.lock === 'function') {
                    await screen.orientation.lock('landscape');
                }
            } catch (err) {
                // Ignore unsupported orientation lock
            }
        }

        this.updatePauseOverlayVisibility(this.gameEngine?.isPaused || false);
    }

    async exitGame(shouldPopHistory = true) {
        if (!this.isActive && !this.gamePanel?.classList.contains('phonk-mobile-fullscreen')) {
            return;
        }
        this.isActive = false;
        this.updatePauseOverlayVisibility(false);

        // Immediately remove mobile fullscreen styling
        if (this.gamePanel) {
            this.gamePanel.classList.remove('phonk-mobile-fullscreen');
        }

        // Stop game engine & audio immediately
        if (window.__phonkStopEngine) {
            window.__phonkStopEngine();
        }

        // Unlock screen orientation
        try {
            if (screen.orientation && typeof screen.orientation.unlock === 'function') {
                screen.orientation.unlock();
            }
        } catch (err) {
            // Ignore unlock errors
        }

        // Exit fullscreen if active
        try {
            if ((document.fullscreenElement || document.webkitFullscreenElement) && document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
            }
        } catch (err) {
            // Ignore exitFullscreen errors
        }

        // Clean up URL hash if still #game
        if (window.location.hash === '#game') {
            try {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } catch (e) {
                // Ignore
            }
        }

        // Switch back to Trade Track ('code' tab) IMMEDIATELY
        if (window.app && window.app.ui && typeof window.app.ui.switchTab === 'function') {
            window.app.ui.switchTab('code');
        }

        // If history back should be popped (e.g. from exit button click)
        if (shouldPopHistory && window.history.state && window.history.state.inPhonkGame) {
            window.history.back();
        }
    }

    handleExitClick(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        this.exitGame(true);
    }

    handlePopState(e) {
        if (this.isActive) {
            // Mobile back button was pressed -> exit game to Trade Track immediately!
            this.exitGame(false);
        }
    }

    handleFullscreenChange() {
        if (this.isActive && !document.fullscreenElement && !document.webkitFullscreenElement && this.isMobileDevice()) {
            this.exitGame(false);
        }
    }

    destroy() {
        if (this.exitBtn) {
            this.exitBtn.removeEventListener('click', this.handleExitClick);
        }
        window.removeEventListener('popstate', this.handlePopState);
        document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    }
}
