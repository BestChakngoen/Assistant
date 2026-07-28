/**
 * PhonkInputHandler.js - Keyboard, Mobile Touch & Button Input Controller
 * Encapsulates all event listeners for Phonk Runner
 */
import { PHONK_CONFIG } from './PhonkConfig.js';

export class PhonkInputHandler {
    constructor(canvas, callbacks = {}) {
        this.canvas = canvas;
        this.callbacks = callbacks; // { onJump, onSlide, onReleaseSlide }
        this.lastTouch = 0;

        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        
        this.initListeners();
    }

    isInputActive() {
        const activeEl = document.activeElement;
        return activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
    }

    handleKeyDown(e) {
        if (this.isInputActive()) return;
        if (e.code === 'KeyP' || e.code === 'Escape') {
            e.preventDefault();
            if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
            return;
        }
        if ((e.code === 'Space' || e.code === 'ArrowUp') && !e.repeat) {
            e.preventDefault();
            if (this.callbacks.onJump) this.callbacks.onJump();
        } else if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ArrowDown') && !e.repeat) {
            e.preventDefault();
            if (this.callbacks.onSlide) this.callbacks.onSlide();
        }
    }

    handleKeyUp(e) {
        if (this.isInputActive()) return;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ArrowDown') {
            if (this.callbacks.onReleaseSlide) this.callbacks.onReleaseSlide();
        }
    }

    handleCanvasClick(e) {
        if (Date.now() - this.lastTouch < 350) return;
        if (this.canvas) {
            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Top-right pause button check
            if (clickX >= rect.width - 60 && clickY <= 48) {
                if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
                return;
            }

            // 2-Handed Mobile Landscape Controls: Left half = JUMP, Right half = SLIDE
            if (clickX < rect.width / 2) {
                if (this.callbacks.onJump) this.callbacks.onJump();
            } else {
                if (this.callbacks.onSlide) this.callbacks.onSlide();
                setTimeout(() => {
                    if (this.callbacks.onReleaseSlide) this.callbacks.onReleaseSlide();
                }, 380);
            }
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        this.lastTouch = Date.now();
        if (this.canvas && e.touches && e.touches.length > 0) {
            const rect = this.canvas.getBoundingClientRect();
            const touch = e.touches[0];
            const touchX = touch.clientX - rect.left;
            const touchY = touch.clientY - rect.top;

            // Top-right pause button check
            if (touchX >= rect.width - 60 && touchY <= 48) {
                if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
                return;
            }

            // 2-Handed Mobile Landscape Controls: Left half = JUMP, Right half = SLIDE
            if (touchX < rect.width / 2) {
                if (this.callbacks.onJump) this.callbacks.onJump();
            } else {
                if (this.callbacks.onSlide) this.callbacks.onSlide();
            }
        }
    }

    handleTouchEnd(e) {
        if (this.callbacks.onReleaseSlide) this.callbacks.onReleaseSlide();
    }

    initListeners() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);

        if (this.canvas) {
            this.canvas.addEventListener('click', this.handleCanvasClick.bind(this));
            this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        }

        // Mobile On-Screen Buttons with Dynamic Config Sync (Gap & Width)
        const btnContainer = document.getElementById('phonk-mobile-btn-container');
        const btnJump = document.getElementById('btn-game-jump');
        const btnSlide = document.getElementById('btn-game-slide');

        if (btnContainer && PHONK_CONFIG.MOBILE_UI && PHONK_CONFIG.MOBILE_UI.BUTTON_GAP_PX !== undefined) {
            btnContainer.style.gap = `${PHONK_CONFIG.MOBILE_UI.BUTTON_GAP_PX}px`;
        }

        if (PHONK_CONFIG.MOBILE_UI && PHONK_CONFIG.MOBILE_UI.BUTTON_WIDTH_PX !== undefined) {
            const btnW = `${PHONK_CONFIG.MOBILE_UI.BUTTON_WIDTH_PX}px`;
            if (btnJump) btnJump.style.width = btnW;
            if (btnSlide) btnSlide.style.width = btnW;
        }

        if (btnJump) {
            btnJump.addEventListener('mousedown', (e) => { e.preventDefault(); if (this.callbacks.onJump) this.callbacks.onJump(); });
            btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.callbacks.onJump) this.callbacks.onJump(); }, { passive: false });
        }

        if (btnSlide) {
            btnSlide.addEventListener('mousedown', (e) => { e.preventDefault(); if (this.callbacks.onSlide) this.callbacks.onSlide(); });
            btnSlide.addEventListener('mouseup', (e) => { e.preventDefault(); if (this.callbacks.onReleaseSlide) this.callbacks.onReleaseSlide(); });
            btnSlide.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.callbacks.onSlide) this.callbacks.onSlide(); }, { passive: false });
            btnSlide.addEventListener('touchend', (e) => { e.preventDefault(); if (this.callbacks.onReleaseSlide) this.callbacks.onReleaseSlide(); }, { passive: false });
        }
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleCanvasClick);
            this.canvas.removeEventListener('touchstart', this.handleTouchStart);
        }
    }
}
