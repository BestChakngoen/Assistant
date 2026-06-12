# Project: Assistant Refactoring & Theme Unification
# Scope: Refactoring & Theme Unification

## Architecture
- **Frontend Core**: `TrackerView.html` and `style.css` handle the UI structure and styling.
- **JavaScript Structure**:
  - `js/main.js`: Main coordinator.
  - `js/health/`: Sub-managers for health features (body, diet, sleep, global save, tab management, utils).
  - `js/services/`: Services for authentication, general data, and market integration.
  - `js/ui/`: UI management logic (specifically `UIManager.js` which handles sidebar and theme setup).
- **Verification Scripts**:
  - `verify-sidebar.js` and `verify-theme.mjs` test the sidebar layout and theme consistency.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Analysis | Explorer analyzes TrackerView.html, style.css, js/ codebase for cleanup targets, theme switching details, and verification requirements. | none | PLANNED |
| 2 | Code Cleanup & Theme Unification | Worker refactors html, css, js/ files to clean formatting, remove dead/commented code, and unify Health menu theme to dark Cyberpunk. | M1 | PLANNED |
| 3 | Test Script Alignment | Worker updates verify-sidebar.js and verify-theme.mjs to reflect unified Cyberpunk theme. | M2 | PLANNED |
| 4 | Challenger Verification | Challenger runs verify-sidebar.js and verify-theme.mjs, checking exit codes and output correctness. | M3 | PLANNED |
| 5 | Forensic Audit | Auditor checks for integrity violations, dummy logic, and ensures no code cheating occurs. | M4 | PLANNED |

## Interface Contracts
- None (refactoring internal layout, maintaining original UI visual features and functionality).

## Code Layout
- `TrackerView.html` - Primary dashboard view.
- `style.css` - Custom style definitions.
- `js/` - Source code for JavaScript application logic.
- `verify-sidebar.js` - Test script for verifying sidebars.
- `verify-theme.mjs` - Test script for verifying the theme.
