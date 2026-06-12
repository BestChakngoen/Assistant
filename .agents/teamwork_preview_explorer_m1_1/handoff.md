# Handoff Report - Dynamic Theme Switching Engine

This handoff report summarizes the findings and design plan for R3 (Theme Switching Engine) to swap styles dynamically between Cyberpunk and bright Minimalist themes.

Detailed proposal and CSS rule mappings can be found in [analysis.md](./analysis.md).

---

## 1. Observation
- **Tailwind Setup**: `TrackerView.html` currently loads Tailwind via CDN at line 15: `<script src="https://cdn.tailwindcss.com"></script>` and defines custom styles inside an inline `<style>` block starting at line 57.
- **Build Scripts**: `package.json` defines a compilation command at line 6: `"build": "tailwindcss -i ./style.css -o ./dist/style.css"`.
- **Custom CSS**: `style.css` contains static colors and custom class declarations (lines 6-35) that mimic the inline styles in `TrackerView.html` but lacks CSS variable abstraction.
- **Tab Swapping**: `js/ui/UIManager.js` contains a `switchTab(tabName)` method (lines 630-682) that swaps visible panels and updates sidebar button styles.
- **Module Imports**: All Javascript module imports are relative (e.g. `js/main.js` line 1: `import { AuthService } from './services/AuthService.js';` and `js/health/sleepManager.js` line 1: `import Utils from './utils.js';`).

---

## 2. Logic Chain
- **Build Architecture**: Because `package.json` contains a build step to compile `style.css` to `dist/style.css`, we should transition `TrackerView.html` to load the compiled `dist/style.css` stylesheet and remove the Tailwind CDN and inline `<style>` block.
- **Engine Trigger**: Because `UIManager.js` centralizes tab changes inside `switchTab(tabName)`, this method should invoke the theme switcher (`setTheme()`) to apply `theme-minimalist` on the `pulls` tab and `theme-cyberpunk` on all other tabs.
- **Root Container Selection**: The `<body>` container wraps the entire document, making it the ideal root target to apply `theme-minimalist` or `theme-cyberpunk` classes.
- **Overriding Tailwind Classes**: Because the HTML contains hardcoded dark Tailwind classes (like `bg-[#080b11]` and `text-slate-100`), using a parent selector class like `.theme-minimalist` in the stylesheet allows us to override these dark colors with high-specificity `!important` styles without altering every tag in `TrackerView.html`.
- **Esm Imports Compliance**: All observed import statements in the local modules are relative, so no refactoring of ES6 module path resolutions is required.

---

## 3. Caveats
- This investigation is read-only and no code changes have been committed.
- Layout readability in Minimalist mode was estimated based on CSS rules and specificity overrides; minor visual adjustments may be needed when viewing the live interface.

---

## 4. Conclusion
Integrating a dynamic theme switching engine is highly feasible and requires only two primary updates:
1. Adding a `setTheme(themeName)` method in `UIManager.js` that changes the `body` class name based on the active tab.
2. Appending the CSS variables and structural overrides detailed in `analysis.md` to `style.css`.

---

## 5. Verification Method
- **Compilation**: Run `npm run build` to ensure the new stylesheet compiles without errors.
- **Live Verification**:
  1. Start HTTP Server using `npx http-server -p 8888`.
  2. Load `http://localhost:8888/TrackerView.html` and inspect the DOM.
  3. Click "Health Track". Ensure the `<body>` element gains the class `.theme-minimalist` and background and text colors change to light gray/indigo.
  4. Click "Dashboard". Ensure the `<body>` element loses the class `.theme-minimalist` and changes back to dark cyberpunk.

---

## 6. Remaining Work
- [ ] Remove the Tailwind CDN script and inline `<style>` block from `TrackerView.html`.
- [ ] Add `<link rel="stylesheet" href="dist/style.css">` to `TrackerView.html`.
- [ ] Add the proposed CSS theme variables and overrides (found in [analysis.md](./analysis.md)) to `style.css`.
- [ ] Implement `setTheme(themeName)` inside `js/ui/UIManager.js` and call it within `switchTab(tabName)`.
- [ ] Rebuild and test theme changes.
