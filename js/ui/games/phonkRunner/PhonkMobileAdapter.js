/**
 * PhonkMobileAdapter.js - Mobile Landscape, Fullscreen, Orientation Lock & Back Navigation Coordinator
 * Encapsulates mobile-specific game UX, orientation locking, fullscreen transitions, and History popstate handling.
 * Adheres strictly to OOP, SOLID, and clean code principles.
 */
export class PhonkMobileAdapter {
    constructor(gameEngine) {
        this.gameEngine = gameEngine;
        this.gamePanel = document.getElementById('game-panel');
        this.exitBtn = document.getElementById('btn-exit-game');
        this.isActive = false;
        this.previousTab = 'code';

        this.handlePopState = this.handlePopState.bind(this);
        this.handleExitClick = this.handleExitClick.bind(this);

        this.init();
    }

    init() {
        if (this.exitBtn) {
            this.exitBtn.addEventListener('click', this.handleExitClick);
        }
        window.addEventListener('popstate', this.handlePopState);

        if (this.gameEngine) {
            this.gameEngine.onPauseChange = (isPaused) => {
                this.updateExitButtonVisibility(isPaused);
            };
        }
    }

    updateExitButtonVisibility(isPaused) {
        if (!this.exitBtn) return;
        // Show ONLY on mobile AND ONLY when game is active and paused
        if (this.isMobileDevice() && this.isActive && isPaused) {
            this.exitBtn.classList.remove('hidden');
            this.exitBtn.classList.add('flex');
        } else {
            this.exitBtn.classList.add('hidden');
            this.exitBtn.classList.remove('flex');
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

            // Push history state so mobile hardware/gesture back button exits game
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
                // Fullscreen might be restricted by browser policy if gesture wasn't recognized
            }

            // Lock screen orientation to landscape if supported
            try {
                if (screen.orientation && typeof screen.orientation.lock === 'function') {
                    await screen.orientation.lock('landscape');
                }
            } catch (err) {
                // iOS Safari or unsupported browsers will fall back to portrait rotate guide
            }
        } else {
            // Desktop mode: strictly hide exit button
            if (this.exitBtn) {
                this.exitBtn.classList.add('hidden');
                this.exitBtn.classList.remove('flex');
            }
        }

        this.updateExitButtonVisibility(this.gameEngine?.isPaused || false);
    }

    async exitGame(shouldPopHistory = true) {
        if (!this.isActive && !this.gamePanel?.classList.contains('phonk-mobile-fullscreen')) {
            return;
        }
        this.isActive = false;
        this.updateExitButtonVisibility(false);

        // Remove mobile fullscreen styling
        if (this.gamePanel) {
            this.gamePanel.classList.remove('phonk-mobile-fullscreen');
        }

        // Hide exit button
        if (this.exitBtn) {
            this.exitBtn.classList.add('hidden');
            this.exitBtn.classList.remove('flex');
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
            if (document.fullscreenElement && document.exitFullscreen) {
                await document.exitFullscreen();
            }
        } catch (err) {
            // Ignore exitFullscreen errors
        }

        // Stop game engine & audio
        if (window.__phonkStopEngine) {
            window.__phonkStopEngine();
        }

        // Clean up URL hash if still #game
        if (window.location.hash === '#game') {
            try {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            } catch (e) {
                // Ignore
            }
        }

        // If history back should be popped
        if (shouldPopHistory && window.history.state && window.history.state.inPhonkGame) {
            window.history.back();
            return;
        }

        // Switch back to previous tab
        const targetTab = this.previousTab || 'code';
        if (window.app && window.app.ui && typeof window.app.ui.switchTab === 'function') {
            window.app.ui.switchTab(targetTab);
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
            // Mobile back button was pressed
            this.exitGame(false);
        }
    }

    destroy() {
        if (this.exitBtn) {
            this.exitBtn.removeEventListener('click', this.handleExitClick);
        }
        window.removeEventListener('popstate', this.handlePopState);
    }
}
