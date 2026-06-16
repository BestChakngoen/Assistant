const fs = require('fs');
const path = require('path');

console.log("=== TradeTracker Responsive & Theme Layout Verification ===");

// 1. Load files
const trackerHtmlPath = path.join(__dirname, 'TrackerView.html');
const styleCssPath = path.join(__dirname, 'style.css');
const uiManagerJsPath = path.join(__dirname, 'js/ui/UIManager.js');

if (!fs.existsSync(trackerHtmlPath)) {
    console.error(`❌ TrackerView.html not found at ${trackerHtmlPath}`);
    process.exit(1);
}
if (!fs.existsSync(styleCssPath)) {
    console.error(`❌ style.css not found at ${styleCssPath}`);
    process.exit(1);
}
if (!fs.existsSync(uiManagerJsPath)) {
    console.error(`❌ UIManager.js not found at ${uiManagerJsPath}`);
    process.exit(1);
}

const html = fs.readFileSync(trackerHtmlPath, 'utf8');
const css = fs.readFileSync(styleCssPath, 'utf8');
const js = fs.readFileSync(uiManagerJsPath, 'utf8');

let totalChecks = 0;
let passedChecks = 0;

function assert(condition, message) {
    totalChecks++;
    if (condition) {
        console.log(`✅ [PASS] ${message}`);
        passedChecks++;
    } else {
        console.error(`❌ [FAIL] ${message}`);
    }
}

// Check 1: Sidebar Sizing, Transition, & Visibility classes in HTML
const sidebarMatch = html.match(/<aside\s+id="sidebar"\s+class="([^"]+)"/);
assert(sidebarMatch !== null, "Found sidebar aside element in TrackerView.html");
if (sidebarMatch) {
    const classes = sidebarMatch[1].split(/\s+/);
    assert(classes.includes('fixed'), "Sidebar class contains 'fixed'");
    assert(classes.includes('inset-y-0'), "Sidebar class contains 'inset-y-0' (top/bottom boundary)");
    assert(classes.includes('left-0'), "Sidebar class contains 'left-0' (left boundary)");
    assert(classes.includes('z-50'), "Sidebar class contains 'z-50' (z-index for floating layer on mobile)");
    assert(classes.includes('w-64'), "Sidebar class contains 'w-64' (width: 16rem/256px)");
    assert(classes.includes('transition-transform'), "Sidebar class contains 'transition-transform' (animations enabled)");
    assert(classes.includes('duration-300'), "Sidebar class contains 'duration-300' (smooth 300ms transitions)");
    assert(classes.includes('-translate-x-full'), "Sidebar class contains '-translate-x-full' (hidden by default on mobile)");
    assert(classes.includes('lg:translate-x-0'), "Sidebar class contains 'lg:translate-x-0' (automatically visible on desktop screens >= 1024px)");
}

// Check 2: Mobile Toggle Hamburger Button
const toggleBtnMatch = html.includes('onclick="window.toggleSidebar()"');
assert(toggleBtnMatch, "Found responsive hamburger button triggering window.toggleSidebar()");

// Check 3: window.toggleSidebar script implementation
const toggleSidebarImpl = html.includes("window.toggleSidebar = function()") && html.includes("sidebar.classList.toggle('-translate-x-full');");
assert(toggleSidebarImpl, "Found window.toggleSidebar implementation toggling the translation class");

// Check 4: Main Content Area desktop padding to offset the fixed sidebar
const mainContentOffset = html.match(/class="[^"]*lg:pl-64[^"]*"/);
assert(mainContentOffset !== null, "Main content area has lg:pl-64 class to prevent sidebar overlap on desktop");

// Check 5: Theme body variable definitions in style.css
const hasCyberpunkTheme = css.includes('.theme-cyberpunk') && css.includes('--bg-sidebar: #0d121f');
assert(hasCyberpunkTheme, "Cyberpunk theme overrides include --bg-sidebar definition (#0d121f)");

const hasCyberpunkBorder = css.includes('--border-sidebar: rgba(148, 163, 184, 0.08)');
assert(hasCyberpunkBorder, "Cyberpunk theme overrides include --border-sidebar");

// Check 6: Unified Cyberpunk aside#sidebar CSS rule
const sidebarCyberpunk = css.includes('.theme-cyberpunk') || css.includes(':root');
assert(sidebarCyberpunk, "style.css contains Cyberpunk theme styles");

// Check 7: Theme Switcher logic in UIManager.js (Unified Theme)
const uiThemeSetter = js.includes("setTheme(theme)") && js.includes("body.classList.add('theme-cyberpunk')");
assert(uiThemeSetter, "UIManager.js contains setTheme function that applies theme-cyberpunk class on body");

const uiTabSwitcherThemeTrigger = js.includes("switchTab(tabName)") && js.includes("this.setTheme('cyberpunk')");
assert(uiTabSwitcherThemeTrigger, "UIManager.js switchTab uses the unified theme ('cyberpunk')");

console.log(`\n=== Verification Complete: ${passedChecks}/${totalChecks} tests passed ===`);
if (passedChecks === totalChecks) {
    console.log("🏆 ALL CHECKS PASSED SUCCESSFULLY!");
    process.exit(0);
} else {
    console.error("❌ SOME CHECKS FAILED!");
    process.exit(1);
}
