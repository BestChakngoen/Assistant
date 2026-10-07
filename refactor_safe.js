const fs = require('fs');

let content = fs.readFileSync('js/main.js', 'utf8');

// 1. Update imports
content = content.replace(/from '\.\/app\/trading\/RiskCalculator\.js';/, "from './trade/RiskCalculator.js';");
content = content.replace(/from '\.\/app\/notes\/NoteHandler\.js';/, "from './trade/NoteHandler.js';");
content = content.replace(/from '\.\/app\/trading\/TradeActionsHandler\.js';/, "from './trade/TradeActionsHandler.js';");
content = content.replace(/from '\.\/app\/market\/MarketWidgetManager\.js';/, "from './market/MarketWidgetManager.js';");
content = content.replace(/from '\.\/app\/networth\/NetWorthManager\.js';/, "from './networth/NetWorthManager.js';");
content = content.replace(/from '\.\/app\/settings\/SystemSettingsManager\.js';/, "from './settings/SystemSettingsManager.js';");
content = content.replace(/from '\.\/app\/trading\/TradeDisciplineManager\.js';/, "from './trade/TradeDisciplineManager.js';");
content = content.replace(/import { UIUtils } from '\.\/ui\/UIUtils\.js';/, ""); // Avoid duplicate
content = content.replace(/import { NotificationManager } from '\.\/notifications\/NotificationManager\.js';/, "import { NotificationManager } from './notifications/NotificationManager.js';\nimport { UIUtils } from './ui/UIUtils.js';");

// 2. Refactor setupCustomSlideBar
// First remove the definition of setupCustomSlideBar
const slideBarDefRegex = /\/\*\*\s*\n\s*\* Initializes universal horizontal slide bars \(\.custom-slide-bar\)(.|\n)*?element\.addEventListener\('mousedown', onMouseDown\);\n\s*}/;
content = content.replace(slideBarDefRegex, '');

// Then replace the call this.setupCustomSlideBar(container) with UIUtils.setupCustomSlideBar(container)
content = content.replace(/this\.setupCustomSlideBar\(container\);/g, "UIUtils.setupCustomSlideBar(container);");

// 3. Tab IDs updates
content = content.replace(/'tab-code'/g, "'tab-trade'");
content = content.replace(/'code'/g, "'trade'"); // switchTab('code') -> switchTab('trade')
content = content.replace(/'tab-actions'/g, "'tab-market'");
content = content.replace(/'actions'/g, "'market'");

// 4. Refactor onAuthStateChanged
// The onAuthStateChanged body starts at "if (user) {" and ends before "this.initHealthTrack();" or similar at the end of the callback.
// Actually, let's extract it carefully.
// I'll replace the inside of onAuthStateChanged with calls to `this._handleUserLogin(user)` and `this._handleUserLogout()`.
const authStateRegex = /this\.auth\.onStateChange\(async \(user\) => \{([\s\S]*?)\}\);/;
const match = content.match(authStateRegex);
if (match) {
    let body = match[1];
    
    // Split into login block (if user) and logout block (else)
    // The if (user) { block starts right away. The else block is at the end.
    // Let's just use string splitting.
    const elseIndex = body.lastIndexOf('} else {');
    
    if (elseIndex !== -1) {
        let loginBody = body.substring(0, elseIndex).trim();
        if (loginBody.startsWith('if (user) {')) {
            loginBody = loginBody.substring(11).trim();
            // remove trailing brace of if(user)
            if (loginBody.endsWith('}')) {
                loginBody = loginBody.substring(0, loginBody.length - 1).trim();
            }
        }
        
        let logoutBody = body.substring(elseIndex + 8).trim();
        // remove trailing brace of else
        if (logoutBody.endsWith('}')) {
            logoutBody = logoutBody.substring(0, logoutBody.length - 1).trim();
        }

        // Replace the whole onAuthStateChanged
        content = content.replace(authStateRegex, 
            "this.auth.onStateChange(async (user) => {\n" +
            "            if (user) {\n" +
            "                await this._handleUserLogin(user);\n" +
            "            } else {\n" +
            "                this._handleUserLogout();\n" +
            "            }\n" +
            "        });"
        );
        
        // Add the extracted methods before `handleLogin`
        const newMethods = `
    async _handleUserLogin(user) {
        ${loginBody}
    }

    _handleUserLogout() {
        ${logoutBody}
    }

`;
        content = content.replace('// --- Delegation Handlers ---', newMethods + '    // --- Delegation Handlers ---');
    }
} else {
    console.log("Could not match onAuthStateChanged!");
}

fs.writeFileSync('js/main.js', content, 'utf8');
console.log("Refactoring complete");
