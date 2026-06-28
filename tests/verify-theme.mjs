import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- MOCK BROWSER ENVIRONMENT ---
const mockClassList = {
    classes: new Set(),
    add(c) { this.classes.add(c); },
    remove(c) { this.classes.delete(c); },
    contains(c) { return this.classes.has(c); },
    reset() { this.classes.clear(); }
};

global.window = {
    addEventListener() {},
    removeEventListener() {}
};
global.document = {
    body: {
        classList: mockClassList
    },
    getElementById(id) {
        return {
            id,
            getContext() {
                return new Proxy({}, {
                    get: (target, prop) => {
                        if (prop === 'measureText') return () => ({ width: 100 });
                        return () => {};
                    }
                });
            },
            getBoundingClientRect() { return { width: 800, height: 600 }; },
            classList: {
                add() {},
                remove() {},
                contains() { return false; },
                toggle() {}
            },
            style: {},
            addEventListener() {}
        };
    },
    querySelectorAll() {
        return [];
    }
};

global.Chart = class {
    static defaults = { font: {}, color: '' };
    static register() {}
    constructor() {}
};
global.ChartDataLabels = {};

global.localStorage = {
    getItem() { return null; },
    setItem() {}
};

global.ResizeObserver = class {
    observe() {}
    disconnect() {}
};

// Import UIManager dynamically after environment mock
const { UIManager } = await import('../js/ui/UIManager.js');

console.log('--- RUNNING THEME SWITCHING ENGINE VERIFICATION ---');

let passed = true;

function assert(condition, message) {
    if (condition) {
        console.log(`[PASS] ${message}`);
    } else {
        console.error(`[FAIL] ${message}`);
        passed = false;
    }
}

// 1. Verify UIManager Constructor Default Theme
try {
    mockClassList.reset();
    const ui = new UIManager();
    assert(mockClassList.contains('theme-cyberpunk'), 'Constructor should apply theme-cyberpunk by default');
    assert(!mockClassList.contains('theme-minimalist'), 'Constructor should NOT apply theme-minimalist by default');
} catch (e) {
    console.error('Failed to instantiate UIManager or verify constructor:', e);
    passed = false;
}

// 2. Verify Tab Switching
try {
    mockClassList.reset();
    const ui = new UIManager();
    
    // Switch to 'pulls' -> Should remain theme-cyberpunk (unified theme)
    ui.switchTab('pulls');
    assert(mockClassList.contains('theme-cyberpunk'), "switchTab('pulls') should keep theme-cyberpunk under unified theme rule");
    assert(!mockClassList.contains('theme-minimalist'), "switchTab('pulls') should not apply theme-minimalist");
    
    // Switch back to 'code' -> Cyberpunk
    ui.switchTab('code');
    assert(mockClassList.contains('theme-cyberpunk'), "switchTab('code') should apply theme-cyberpunk");
    assert(!mockClassList.contains('theme-minimalist'), "switchTab('code') should not apply theme-minimalist");

    // Switch to 'issues' -> Cyberpunk
    ui.switchTab('issues');
    assert(mockClassList.contains('theme-cyberpunk'), "switchTab('issues') should apply theme-cyberpunk");
    assert(!mockClassList.contains('theme-minimalist'), "switchTab('issues') should not apply theme-minimalist");
} catch (e) {
    console.error('Failed during tab switching verification:', e);
    passed = false;
}

// 3. Verify Compiled CSS Variables and Transitions in dist/style.css
try {
    const cssPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist/style.css');
    if (!fs.existsSync(cssPath)) {
        throw new Error(`dist/style.css not found at ${cssPath}`);
    }
    const cssContent = fs.readFileSync(cssPath, 'utf8');
    
    // Verify CSS variables exist
    assert(cssContent.includes('--bg-main'), 'CSS should define --bg-main');
    assert(cssContent.includes('--bg-app'), 'CSS should define --bg-app');
    assert(cssContent.includes('--bg-sidebar'), 'CSS should define --bg-sidebar');
    assert(cssContent.includes('--accent-color'), 'CSS should define --accent-color');
    
    // Verify theme selectors are in CSS
    assert(cssContent.includes('.theme-cyberpunk') || cssContent.includes('theme-cyberpunk'), 'CSS should contain .theme-cyberpunk class definitions');
    assert(cssContent.includes('.theme-minimalist') || cssContent.includes('theme-minimalist'), 'CSS should contain .theme-minimalist class definitions');
    
    // Verify transition properties exist
    assert(cssContent.includes('transition: background-color') || cssContent.includes('transition:all') || cssContent.includes('transition: all'), 'CSS should define transition properties');
    
    // Check specific variables content in theme cyberpunk vs minimalist
    const cyberpunkIndex = cssContent.indexOf('theme-cyberpunk');
    const minimalistIndex = cssContent.indexOf('theme-minimalist');
    
    assert(cyberpunkIndex !== -1, 'Found theme-cyberpunk in CSS');
    assert(minimalistIndex !== -1, 'Found theme-minimalist in CSS');
    
} catch (e) {
    console.error('Failed to verify CSS file:', e);
    passed = false;
}

if (passed) {
    console.log('\n--- VERIFICATION SUCCESSFUL ---');
    process.exit(0);
} else {
    console.error('\n--- VERIFICATION FAILED ---');
    process.exit(1);
}
