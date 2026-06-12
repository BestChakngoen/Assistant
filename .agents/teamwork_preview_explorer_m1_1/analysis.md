# Design Proposal: Dynamic Theme Switching Engine (Cyberpunk ↔ Bright Minimalist)

This document presents the technical analysis and design plan for implementing a dynamic theme switching engine (Requirement R3) for the TradeTracker Web App. The engine allows seamless transitioning between the dark, high-contrast **Cyberpunk** theme (default for the Dashboard/Code tab) and the clean, light-colored **Bright Minimalist** theme (default for the Health Track/Pull Requests tab).

---

## 1. Codebase Summary & Current State
The TradeTracker Web App UI is constructed using **Tailwind CSS Utility Classes** combined with a small set of custom styles defined in `style.css` and duplicated inline in `TrackerView.html`'s `<style>` block.

### Key Files Examined:
* **`TrackerView.html`**: The main entry point containing the full structural layout. It currently loads Tailwind CSS from a CDN script (`https://cdn.tailwindcss.com`) and contains custom theme overrides inline.
* **`style.css`**: The source CSS input file for Tailwind CSS compiling. It currently contains the same custom class definitions as the HTML file (e.g., `.glass-panel`, `.neon-text`, `.nav-active`).
* **`js/ui/UIManager.js`**: Manages view swapping via the `switchTab(tabName)` method, navigation bar states, and populates Chart.js widgets.
* **`js/main.js`**: Orchestrates application modules and event bindings, including calls to `UIManager.js` tab switches.
* **`js/health/*`**: Individual managers (`sleepManager.js`, `bodyManager.js`, `dietManager.js`) that render custom HTML/CSS-based inline SVG graphs.

### Verification of JS Module Imports:
All JavaScript ES modules in `js/` utilize relative import syntax (e.g. `import { AuthService } from './services/AuthService.js';` and `import Utils from './utils.js';`), satisfying the relative imports constraint.

---

## 2. Proposal for R3: Theme Switching Engine
Rather than refactoring hundreds of Tailwind utility classes inside the HTML, the theme switching engine will manipulate a single state class on the **`<body>`** root application container. The stylesheet will react dynamically by applying overrides and custom variables.

### JavaScript Integration (`js/ui/UIManager.js`)
We will introduce a `setTheme` method in `UIManager.js` and hook it into the `switchTab` navigation sequence:

```javascript
// Add Theme Helper Method
setTheme(themeName) {
    const body = document.body;
    if (themeName === 'minimalist') {
        body.classList.remove('theme-cyberpunk');
        body.classList.add('theme-minimalist');
    } else {
        body.classList.remove('theme-cyberpunk', 'theme-minimalist');
        body.classList.add('theme-cyberpunk');
    }
}

// Hook into existing switchTab(tabName)
switchTab(tabName) {
    // Dynamically toggle theme based on active tab
    if (tabName === 'pulls') { // pulls = Health Track
        this.setTheme('minimalist');
    } else {
        this.setTheme('cyberpunk');
    }
    
    // ... (rest of the existing switchTab logic)
}
```

* **Constructor Default**: Call `this.setTheme('cyberpunk')` during initialization to enforce default cyberpunk styles.

---

## 3. CSS Variable Mapping & Style Overrides (`style.css`)
We will configure CSS custom variables in `style.css` (which compiles to `dist/style.css`). The variables will govern the colors, shadows, and borders of both custom panels and structural Tailwind components.

### 3.1 CSS Theme Variables Configuration
```css
/* Custom variables for themes */
:root {
    /* Cyberpunk defaults */
    --bg-main: #0b1121;
    --bg-main-image: radial-gradient(#1e293b 1px, transparent 1px);
    --bg-app: #080b11;
    --bg-sidebar: #0d121f;
    --bg-header: rgba(13, 18, 31, 0.8);
    --border-color: rgba(255, 255, 255, 0.1);
    --border-sidebar: rgba(148, 163, 184, 0.08); /* slate-800/60 */
    --text-primary: #e2e8f0; /* slate-200 */
    --text-muted: #64748b; /* slate-500 */
    
    /* Panel specifics */
    --panel-bg: rgba(30, 41, 59, 0.7);
    --panel-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
    
    /* Inputs */
    --input-bg: #0f172a;
    --input-border: #334155;
    --input-text: #ffffff;
    --input-focus-border: #38bdf8;
    --input-focus-shadow: rgba(56, 189, 248, 0.2);
    
    /* Accents & Active States */
    --accent-color: #38bdf8; /* cyan-400 */
    --accent-glow: 0 0 10px rgba(56, 189, 248, 0.5);
    --nav-active-bg: rgba(56, 189, 248, 0.15);
    --nav-active-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
}

.theme-minimalist {
    /* Bright Minimalist Overrides */
    --bg-main: #f8fafc; /* slate-50 */
    --bg-main-image: radial-gradient(#cbd5e1 1px, transparent 1px);
    --bg-app: #f8fafc;
    --bg-sidebar: #ffffff;
    --bg-header: rgba(255, 255, 255, 0.8);
    --border-color: #e2e8f0; /* slate-200 */
    --border-sidebar: #cbd5e1; /* slate-300 */
    --text-primary: #0f172a; /* slate-900 */
    --text-muted: #475569; /* slate-600 */
    
    /* Panel specifics */
    --panel-bg: #ffffff;
    --panel-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05);
    
    /* Inputs */
    --input-bg: #ffffff;
    --input-border: #cbd5e1;
    --input-text: #0f172a;
    --input-focus-border: #4f46e5; /* indigo-600 */
    --input-focus-shadow: rgba(99, 102, 241, 0.15);
    
    /* Accents & Active States */
    --accent-color: #4f46e5; /* indigo-600 */
    --accent-glow: none;
    --nav-active-bg: rgba(79, 70, 229, 0.08); /* Indigo 8% */
    --nav-active-shadow: none;
}
```

### 3.2 Refactoring Custom Utility Classes in `style.css`
Update existing classes in `style.css` to consume the CSS variables:
```css
body {
    background-color: var(--bg-main);
    background-image: var(--bg-main-image);
    background-size: 20px 20px;
    transition: background-color 0.3s ease, background-image 0.3s ease;
}

.glass-panel {
    background: var(--panel-bg);
    backdrop-filter: blur(10px);
    border: 1px solid var(--border-color);
    box-shadow: var(--panel-shadow);
    transition: all 0.3s ease;
}

.theme-minimalist .glass-panel {
    backdrop-filter: none;
}

.neon-text {
    text-shadow: var(--accent-glow);
    transition: text-shadow 0.3s ease;
}

.nav-active {
    background-color: var(--nav-active-bg);
    border: 1px solid var(--accent-color);
    color: var(--accent-color);
    box-shadow: var(--nav-active-shadow);
    transition: all 0.2s ease;
}

/* Input Styles */
input, select {
    background-color: var(--input-bg);
    border: 1px solid var(--input-border);
    color: var(--input-text);
    transition: all 0.2s;
}

input:focus, select:focus {
    outline: none;
    border-color: var(--input-focus-border);
    box-shadow: 0 0 10px var(--input-focus-shadow);
}

::-webkit-scrollbar-track {
    background: var(--input-bg);
}

::-webkit-scrollbar-thumb {
    background: var(--input-border);
}
```

### 3.3 Tailwind Utility Overrides in Minimalist Mode
To ensure the UI switches seamlessly without touching individual HTML classes, we define high-specificity overrides under the `.theme-minimalist` parent:

```css
/* Layout and structural overrides */
.theme-minimalist #app-content {
    background-color: var(--bg-app) !important;
    color: var(--text-primary) !important;
}

.theme-minimalist aside#sidebar {
    background-color: var(--bg-sidebar) !important;
    border-right-color: var(--border-sidebar) !important;
}

.theme-minimalist main {
    background-color: var(--bg-app) !important;
}

.theme-minimalist header {
    background-color: var(--bg-sidebar) !important;
    border-bottom-color: var(--border-sidebar) !important;
}

/* Profile section bottom border */
.theme-minimalist .bg-\[\#0a0d16\]\/40 {
    background-color: var(--bg-main) !important;
    border-top: 1px solid var(--border-color) !important;
}

/* Core slate text color mapping adjustment for readability on light BG */
.theme-minimalist .text-slate-100,
.theme-minimalist .text-slate-200,
.theme-minimalist .text-slate-300 {
    color: var(--text-primary) !important;
}

.theme-minimalist .text-slate-400,
.theme-minimalist .text-slate-500 {
    color: var(--text-muted) !important;
}

.theme-minimalist h1.text-white,
.theme-minimalist h2.text-white,
.theme-minimalist h3.text-white,
.theme-minimalist h4.text-white,
.theme-minimalist p.text-white,
.theme-minimalist span.text-white {
    color: var(--text-primary) !important;
}

/* Active and Hover Tabs in Minimalist Mode */
.theme-minimalist #repo-tabs-container button.border-cyan-500 {
    border-color: var(--accent-color) !important;
    background-color: var(--nav-active-bg) !important;
    color: var(--accent-color) !important;
}

.theme-minimalist #repo-tabs-container button.border-transparent:hover {
    background-color: #f1f5f9 !important;
    color: #0f172a !important;
}

/* Sub-tabs inside Health Track */
.theme-minimalist .nav-tab {
    border: 1px solid var(--border-color) !important;
    background-color: #ffffff !important;
    color: var(--text-muted) !important;
}

.theme-minimalist .nav-tab.bg-slate-800 {
    background-color: var(--accent-color) !important;
    color: #ffffff !important;
    border-color: var(--accent-color) !important;
}

/* Adjust date & time picker icon color scheme */
.theme-minimalist input[type="date"],
.theme-minimalist input[type="time"] {
    color-scheme: light;
}
```

### 3.4 Custom Graphs Overrides (Health Track Tabs)
The custom graphs in the Health Track are generated dynamically via JavaScript by rendering SVG lines and HTML elements. The following overrides adapt them to Minimalist style without modifying JS logic:

```css
/* Sleep Pattern Graph Overrides */
.theme-minimalist #sleepPatternChart .bg-cyan-500 {
    background-color: var(--accent-color) !important;
    box-shadow: none !important;
}
.theme-minimalist #sleepPatternChart .bg-slate-700 {
    background-color: var(--border-color) !important;
}
.theme-minimalist #sleepPatternChart .border-cyan-500\/20 {
    border-color: rgba(79, 70, 229, 0.2) !important;
}
.theme-minimalist #sleepPatternChart .text-cyan-400 {
    color: var(--accent-color) !important;
}
.theme-minimalist #sleepPatternChart .bg-slate-950 {
    background-color: var(--bg-main) !important;
    border: 1px solid var(--border-color) !important;
    color: var(--text-primary) !important;
}

/* Weight Chart Overrides */
.theme-minimalist #weightChartContainer svg polyline {
    stroke: var(--accent-color) !important;
}
.theme-minimalist #weightChartContainer div[style*="background-color: rgb(6, 182, 212)"],
.theme-minimalist #weightChartContainer div[style*="background-color: #06b6d4"] {
    background-color: var(--accent-color) !important;
}
.theme-minimalist #weightChartContainer .ring-cyan-500 {
    --tw-ring-color: var(--accent-color) !important;
}
.theme-minimalist #weightChartContainer .border-green-500\/50 {
    border-color: rgba(5, 150, 105, 0.4) !important; /* Emerald 600 */
}
.theme-minimalist #weightChartContainer .text-green-400 {
    color: #059669 !important;
}
.theme-minimalist #weightChartContainer .bg-slate-950\/80 {
    background-color: #ffffff !important;
    border: 1px solid var(--border-color) !important;
    color: #059669 !important;
}

/* Weekly Calories Chart Overrides */
.theme-minimalist #weeklyChartContainer .bg-slate-900\/30 {
    background-color: #ffffff !important;
    border-color: var(--border-color) !important;
}
.theme-minimalist #weeklyChartContainer .bg-slate-950 {
    background-color: var(--bg-main) !important;
    border-color: var(--border-color) !important;
}
.theme-minimalist #weeklyChartContainer .ring-cyan-500 {
    --tw-ring-color: var(--accent-color) !important;
}
.theme-minimalist #weeklyChartContainer .text-cyan-400 {
    color: var(--accent-color) !important;
}
.theme-minimalist #weeklyChartContainer .bg-slate-800 {
    background-color: var(--border-color) !important;
}
.theme-minimalist #weeklyChartContainer .border-slate-800 {
    border-color: var(--border-color) !important;
}
.theme-minimalist #weeklyChartContainer .border-slate-700\/50 {
    border-color: var(--border-sidebar) !important;
}

/* functional colors adapt to light backgrounds for readability */
.theme-minimalist .text-cyan-400 { color: var(--accent-color) !important; }
.theme-minimalist .text-pink-400 { color: #db2777 !important; }
.theme-minimalist .text-amber-400 { color: #d97706 !important; }
.theme-minimalist .text-purple-400 { color: #7c3aed !important; }
.theme-minimalist .text-green-400 { color: #16a34a !important; }
.theme-minimalist .text-red-400 { color: #dc2626 !important; }
.theme-minimalist .text-blue-400 { color: #2563eb !important; }
.theme-minimalist .text-orange-400 { color: #ea580c !important; }
```

---

## 4. Recommendations for Cleaner Integration
To clean up duplication and execute the compile step correctly:
1. **Link `dist/style.css` in HTML**: Remove the `<style>` block containing duplicate styles inside the `<head>` of `TrackerView.html`, and add `<link rel="stylesheet" href="dist/style.css">`.
2. **Remove Tailwind CDN script**: Since the project has moved to a compiled PostCSS Tailwind build process (according to `BUILD_SETUP.md`), remove `<script src="https://cdn.tailwindcss.com"></script>` from `TrackerView.html` to speed up load time and prevent conflicts between the CDN engine and compiled CSS.
