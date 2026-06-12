# Project: Assistant Refactoring & Theme Unification

## Architecture
- **Frontend Core**: `TrackerView.html` and `style.css` handle the UI structure and styling.
- **JavaScript Structure**:
  - `js/main.js`: Main coordinator.
  - `js/health/`: Contains sub-managers for health features (body, diet, sleep, global save, tab management, utils).
  - `js/services/`: Services for authentication, general data, and market integration.
  - `js/ui/`: UI management logic.
- **Verification Scripts**:
  - `verify-sidebar.js` and `verify-theme.mjs` test the sidebar layout and theme consistency.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Exploration & Analysis | Identify refactoring targets, theme-switching logic, and verify requirements | none | IN_PROGRESS |
| 2 | Refactoring & Unification | Clean up html/css/js files, standardize code, unify Health theme | 1 | PLANNED |
| 3 | Verification Script Alignment | Update verify-sidebar.js and verify-theme.mjs | 2 | PLANNED |
| 4 | QA & Review Verification | Perform code reviews and run tests | 3 | PLANNED |
| 5 | Forensic Audit Verification | Audit code for integrity and compliance | 4 | PLANNED |

## Code Layout
- `TrackerView.html` - Primary dashboard view.
- `style.css` - Custom style definitions.
- `js/` - Source code for JavaScript application logic.
- `verify-sidebar.js` - Test script for verifying sidebars.
- `verify-theme.mjs` - Test script for verifying the theme.
