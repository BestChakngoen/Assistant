/**
 * PhonkMobileAdapter.js - Mobile Landscape, Fullscreen, Orientation Lock & Back Navigation Coordinator
 * Encapsulates mobile-specific game UX, orientation locking, fullscreen transitions, and History popstate handling.
 * Adheres strictly to OOP, SOLID, and clean code principles.
 */
export class PhonkMobileAdapter {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.gamePanel = document.getElementById('game-panel');
        this.pauseBtn = document.getElementById('btn-mobile-pause');
        this.exitBtn = document.getElementById('btn-exit-game');
        this.isActive = false;
        this.previousTab = 'code';

        this.handlePopState = this.handlePopState.bind(this);
        this.handleExitClick = this.handleExitClick.bind(this);
        this.handlePauseClick = this.handlePauseClick.bind(this);
        this.handleFullscreenChange = this.handleFullscreenChange.bind(this);

        this.init();
    }

    init() {
        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', this.handleExitClick);
        }
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener('click', this.handlePauseClick);
        }

        window.addEventListener('popstate', this.handlePopState);
        document.addEventListener('fullscreenchange', this.handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);

        if (this.gameEngine) {
            this.gameEngine.onPauseChange = (isPaused) => {
                this.updateControlsVisibility(isPaused);
            };
        }
    }

    updateControlsVisibility(isPaused) {
        const isMobile = this.isMobileDevice();

        // Pause button: show on mobile ONLY during active play (not paused)
        if (this.pauseBtn) {
            if (isMobile && this.isActive && !isPaused) {
                this.pauseBtn.classList.remove('hidden');
                this.pauseBtn.classList.add('flex');
            } else {
                this.pauseBtn.classList.add('hidden');
                this.pauseBtn.classList.remove('flex');
            }
        }

        // Exit button: show on mobile ONLY when game is active AND paused
        if (this.exitBtn) {
            if (isMobile && this.isActive && isPaused) {
                this.exitBtn.classList.remove('hidden');
                this.exitBtn.classList.add('flex');
            } else {
                this.exitBtn.classList.add('hidden');
                this.exitBtn.classList.remove('flex');
            }
        }
    }

    isMobileDevice() {
        const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
        const isNarrow = window.innerWidth <= 1024;
        const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        return (isTouch && isNarrow) || isMobileUA;
    }

    async enterGame(previousTab = 'code') {
        this.previousTab = previousTab || 'code';
        this.isActive = true;

        if (this.isMobileDevice()) {
            if (this.gamePanel) {
                this.gamePanel.classList.add('phonk-mobile-fullscreen');
            }

            // Push history state so mobile hardware/gesture back button exits game immediately
            try {
                if (!window.history.state || !window.history.state.inPhonkGame) {
                    window.history.pushState({ inPhonkGame: true, fromTab: this.previousTab }, '', '#game');
                }
            } catch (e) {
                console.warn('[PhonkMobileAdapter] Failed to push history state:', e);
            }

            // Request Fullscreen on mobile device
            try {
                const root = document.documentElement;
                if (root.requestFullscreen && !document.fullscreenElement) {
                    await root.requestFullscreen();
                }
            } catch (err) {
                // Browser might restrict fullscreen without direct user gesture
            }

            // Lock screen orientation to landscape if supported
            try {
                if (screen.orientation && typeof screen.orientation.lock === 'function') {
                    await screen.orientation.lock('landscape');
                }
            } catch (err) {
                // Ignore unsupported orientation lock
            }
        } else {
            // Desktop mode: strictly hide mobile controls
            if (this.exitBtn) {
                this.exitBtn.classList.add('hidden');
                this.exitBtn.classList.remove('flex');
            }
            if (this.pauseBtn) {
                this.pauseBtn.classList.add('hidden');
                this.pauseBtn.classList.remove('flex');
            }
        }

        this.updateControlsVisibility(this.gameEngine?.isPaused || false);
    }

    async exitGame(shouldPopHistory = true) {
        if (!this.isActive && !this.gamePanel?.classList.contains('phonk-mobile-fullscreen')) {
            return;
        }
        this.isActive = false;
        this.updateControlsVisibility(false);

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

        // Switch back to previous tab IMMEDIATELY
        const targetTab = this.previousTab || 'code';
        if (window.app && window.app.ui && typeof window.app.ui.switchTab === 'function') {
            window.app.ui.switchTab(targetTab);
        }

        // If history back should be popped (e.g. from exit button click)
        if (shouldPopHistory && window.history.state && window.history.state.inPhonkGame) {
            window.history.back();
        }
    }

    handlePauseClick(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (this.gameEngine && typeof this.gameEngine.togglePause === 'function') {
            this.gameEngine.togglePause();
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
            // Mobile back button was pressed -> exit game immediately!
            this.exitGame(false);
        }
    }

    handleFullscreenChange() {
        // On Android, user swipe/back gesture exits fullscreen first.
        // If user exited fullscreen while in mobile game mode, immediately exit game!
        if (this.isActive && !document.fullscreenElement && !document.webkitFullscreenElement && this.isMobileDevice()) {
            this.exitGame(false);
        }
    }

    destroy() {
        if (this.exitBtn) {
            this.exitBtn.removeEventListener('click', this.handleExitClick);
        }
        if (this.pauseBtn) {
            this.pauseBtn.removeEventListener('click', this.handlePauseClick);
        }
        window.removeEventListener('popstate', this.handlePopState);
        document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
    }
}
