# Project Plan: TradeTracker UI Theme & Polish

## Objectives
1. Implement a Dynamic Theme Switching Engine triggered by tab switching:
   - Dashboard (tab-code): Cyberpunk Theme (dark, glowing)
   - Health Track (tab-pulls): Minimalist Theme (bright, clean)
   - Other tabs (Market, Calculator, etc.) can be styled consistently or fallback to their appropriate themes.
2. Polish the Trading Journal & Stats (Cyberpunk Style) under tab-code.
3. Polish the Health Journal (Minimalist Style) under tab-pulls.
4. Modular JS imports and relative ES imports (R4).
5. Build and verify using Tailwind compiler (`npm run build`).
6. Comprehensive verification (automated E2E tests, challenger checks, and forensic audit).

## Steps & Subagents Allocation

### Step 1: Exploration & Plan Analysis (Milestone M1)
- **Agent**: `teamwork_preview_explorer` (Explorer 1)
- **Role**: Codebase Researcher / UX Analyst
- **Task**: Inspect existing files (`TrackerView.html`, `js/ui/UIManager.js`, `style.css`), identify existing cyberpunk styles, design the bright minimalist styling classes, map the theme classes to be transitioned on the root container, and detail the theme-switching logic.
- **Output**: `analysis.md` in `.agents/explorer_1/`

### Step 2: Implementation (Milestone M2)
- **Agent**: `teamwork_preview_worker` (Worker 1)
- **Role**: Senior Web Developer
- **Task**: Implement the dynamic theme switching engine, styles in `style.css`, updates in `js/ui/UIManager.js` to toggle classes on the root container, and polish the CSS styles for Cyberpunk vs. Minimalist themes. Run `npm run build` to verify the compilation.
- **Output**: `handoff.md` and build verification output.

### Step 3: Verification, Reviews & Auditing (Milestone M3)
- **Agents**:
  - `teamwork_preview_reviewer` (Reviewer 1 & 2): verify correctness, responsiveness, and relative imports.
  - `teamwork_preview_challenger` (Challenger 1 & 2): verify theme switching and responsiveness empirically.
  - `teamwork_preview_auditor` (Forensic Auditor): verify no hardcoding, no dummy implementation, code integrity.
