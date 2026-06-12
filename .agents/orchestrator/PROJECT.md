# Project: TradeTracker Theme & Polish

## Architecture
- **Tech Stack**: Vanilla HTML/CSS/JS + Tailwind CSS build pipeline.
- **Entry point**: `TrackerView.html` (redirected from `index.html`).
- **Core modules**:
  - `js/main.js`: Core controller that initializes Services and UI.
  - `js/ui/UIManager.js`: Handles tab switching, sidebar, calculators, and rendering tables.
  - `js/services/AuthService.js`, `js/services/DataService.js`, `js/services/MarketService.js`: Backend & market services.
  - `js/health/*`: Sleep, Body/Weight, Diet, Tab managers under Health Track.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Exploration & Theme Design Plan | Explore layout and document styling class mapping for theme switcher. | None | DONE |
| 2 | M2: Implementation | Implement theme-switching engine, root container class transitions, and Tailwind styling classes for R1 & R2. | M1 | DONE |
| 3 | M3: Verification & Auditing | Run reviews, E2E tests, challenger checks, and forensic audit. | M2 | DONE |

## Interface Contracts
### UIManager ↔ Theme switching
- Root container styling transition logic.
- Switch between Cyberpunk (Code/Dashboard, etc.) and Minimalist (Health Track).

## Code Layout
- `TrackerView.html` - App markup containing tabs and sidebar drawer.
- `style.css` - Source stylesheet with custom Tailwind rules.
- `dist/style.css` - Output stylesheet compiled from `style.css` by tailwindcss.
- `js/ui/UIManager.js` - Tab UI and styling transitions.
- `js/health/` - Health managers.
