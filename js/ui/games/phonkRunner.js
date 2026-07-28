/**
 * Cyber Phonk Runner - Pixel Art Endless Side-Scroller Game Entry Point (Facade)
 * Delegates game loop, rendering, input, and state management to modular engine components.
 */
import { PhonkGameEngine } from './phonkRunner/PhonkGameEngine.js';

let activeEngineInstance = null;

export function initPhonkRunner() {
    const canvas = document.getElementById('phonkRunnerCanvas');
    if (!canvas) return null;

    if (!activeEngineInstance) {
        activeEngineInstance = new PhonkGameEngine(canvas);
    }
    return activeEngineInstance;
}
