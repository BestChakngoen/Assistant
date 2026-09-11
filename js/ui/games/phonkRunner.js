/**
 * Cyber Phonk Runner - Pixel Art Endless Side-Scroller Game Entry Point (Facade)
 * Delegates game loop, rendering, input, and state management to modular engine components.
 */
import { PhonkGameEngine } from './phonkRunner/PhonkGameEngine.js';
import { PhonkMobileAdapter } from './phonkRunner/PhonkMobileAdapter.js';

let activeEngineInstance = null;
let mobileAdapterInstance = null;

export function initPhonkRunner() {
    const canvas = document.getElementById('phonkRunnerCanvas');
    if (!canvas) return null;

    if (!activeEngineInstance) {
        activeEngineInstance = new PhonkGameEngine(canvas);
        window.__phonkEngineInstance = activeEngineInstance;
    }
    if (!mobileAdapterInstance) {
        mobileAdapterInstance = new PhonkMobileAdapter(activeEngineInstance);
        window.__phonkMobileAdapter = mobileAdapterInstance;
    }
    return activeEngineInstance;
}
