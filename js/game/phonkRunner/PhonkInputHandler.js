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

    isGamePanelVisible() {
        const panel = document.getElementById('game-panel');
        return panel && !panel.classList.contains('hidden');
    }

    isInputActive() {
        if (!this.isGamePanelVisible()) return true;
        const activeEl = document.activeElement;
        return activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
    }

    handleKeyDown(e) {
        if (!this.isGamePanelVisible() || this.isInputActive()) return;

        const scrollBlockedKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown'];
        if (scrollBlockedKeys.includes(e.code)) {
            e.preventDefault();
        }

        if (e.code === 'KeyP' || e.code === 'Escape') {
            if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
            return;
        }
        if ((e.code === 'Space' || e.code === 'ArrowUp') && !e.repeat) {
            if (this.callbacks.onJump) this.callbacks.onJump();
        } else if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ArrowDown') && !e.repeat) {
            if (this.callbacks.onSlide) this.callbacks.onSlide();
        }
    }

    handleKeyUp(e) {
        if (!this.isGamePanelVisible() || this.isInputActive()) return;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'ArrowDown') {
            if (this.callbacks.onReleaseSlide) this.callbacks.onReleaseSlide();
        }
    }

    getTouchInfo(clientX, clientY) {
        if (!this.canvas) return { isTopRight: false, isLeftHalf: true };
        const rect = this.canvas.getBoundingClientRect();
        const internalW = this.canvas.width || 960;
        const internalH = this.canvas.height || 540;

        // Account for object-fit: contain letterbox / pillarbox offsets on mobile
        const scale = Math.min(rect.width / internalW, rect.height / internalH) || 1;
        const drawW = internalW * scale;
        const drawH = internalH * scale;
        const offsetX = (rect.width - drawW) / 2;
        const offsetY = (rect.height - drawH) / 2;

        const canvasX = (clientX - rect.left - offsetX) / scale;
        const canvasY = (clientY - rect.top - offsetY) / scale;
        const clickX = clientX - rect.left;
        const clickY = clientY - rect.top;

        // Accurate top-right pause check: works on drawn button AND physical screen corner
        const isTopRight = (canvasX >= internalW - 130 && canvasY <= 90) ||
                           (clickX >= rect.width - 110 && clickY <= 90);

        const isLeftHalf = clickX < rect.width / 2;

        return { canvasX, canvasY, clickX, clickY, isTopRight, isLeftHalf };
    }

    handleCanvasClick(e) {
        if (!this.isGamePanelVisible()) return;
        if (Date.now() - this.lastTouch < 350) return;
        if (this.canvas) {
            // When paused: tapping anywhere on the screen unpauses/resumes!
            if (this.callbacks.isPaused && this.callbacks.isPaused()) {
                if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
                return;
            }

            const info = this.getTouchInfo(e.clientX, e.clientY);
            if (info.isTopRight) {
                if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
                return;
            }

            // 2-Handed Mobile Landscape Controls: Left half = JUMP, Right half = SLIDE
            if (info.isLeftHalf) {
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
        if (!this.isGamePanelVisible()) return;
        e.preventDefault();
        this.lastTouch = Date.now();
        if (this.canvas && e.touches && e.touches.length > 0) {
            // When paused: tapping anywhere on the screen unpauses/resumes!
            if (this.callbacks.isPaused && this.callbacks.isPaused()) {
                if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
                return;
            }

            const touch = e.touches[0];
            const info = this.getTouchInfo(touch.clientX, touch.clientY);

            // Top-right pause button check
            if (info.isTopRight) {
                if (this.callbacks.onTogglePause) this.callbacks.onTogglePause();
                return;
            }

            // 2-Handed Mobile Landscape Controls: Left half = JUMP, Right half = SLIDE
            if (info.isLeftHalf) {
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
