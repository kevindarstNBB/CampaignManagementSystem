# Campaign Management System — Activity Log by User

## Kevin Darst
| Date | Version | Action | Description |
|------|---------|--------|-------------|
| 2026-03-03 | v1.0.0 | Created project | Scaffolded React + Vite project, defined full CMS spec in CLAUDE.md |
| 2026-03-03 | v1.0.0 | Requested feature | Excel/CSV file import with SheetJS, drag-and-drop, column mapping, preview |
| 2026-03-03 | v1.0.0 | Requested feature | Bulk approval status changes with persistent selection, Ctrl+A |
| 2026-03-03 | v1.0.0 | Requested change | Default IDENTIFIER filter set to BUDGET; TAP currency formatting; C/TAP ratio formatting |
| 2026-03-03 | v1.1.0 | Requested feature | Bulk field editing modal with enum/numeric/date modes and before→after preview |
| 2026-03-03 | v1.1.0 | Reported bugs | Client filter using wrong source, Channel filter using wrong field, search crash on null values |
| 2026-03-03 | v1.1.0 | Requested feature | Column visibility toggle with grouped sections, Show All / Reset to Default |
| 2026-03-03 | v1.1.0 | Requested feature | Inline cell editing with double-click, keyboard navigation, auto-recalculation |
| 2026-03-03 | v1.1.0 | Requested change | Renamed "Bulk Edit" to "Set Field Across Selected"; added pencil icon hover cue |
| 2026-03-03 | v1.2.0 | Reported bug | Channel filter still using PROJ_TYPE instead of CHANNEL_IND |
| 2026-03-03 | v1.2.0 | Requested file | Created CHANGELOG.md version log |
| 2026-03-03 | v1.2.0 | Requested file | Created ACTIVITY_LOG.md activity log |

## Claude (AI Assistant)
| Date | Version | Action | Description |
|------|---------|--------|-------------|
| 2026-03-03 | v1.0.0 | Built app | Full CMS in App.jsx — dark theme, summary cards, filter bar, data grid, detail panel, modals, 3 export formats, approval workflow, seed data |
| 2026-03-03 | v1.0.0 | Added feature | ImportModal with SheetJS parsing, drag-and-drop, column mapping (PROJ__ → PROJ_NUM), Replace/Append modes |
| 2026-03-03 | v1.0.0 | Added feature | Bulk approval bar with 5 status buttons, bulk export, Ctrl+A, indeterminate checkbox |
| 2026-03-03 | v1.0.0 | Fixed formatting | Default IDENTIFIER filter, TAP as currency, C/TAP as 3-decimal ratio |
| 2026-03-03 | v1.1.0 | Added feature | BulkEditModal — field picker, enum/date/numeric modes, set/multiply/add, before→after preview |
| 2026-03-03 | v1.1.0 | Fixed bugs | Client filter → dynamic CLIENT_DESC; Channel filter → data-driven; search null-safety |
| 2026-03-03 | v1.1.0 | Added feature | COLUMN_REGISTRY (40+ cols), COLUMN_GROUPS (7 sections), ColumnPicker dropdown, DEFAULT_VISIBLE_COLS |
| 2026-03-03 | v1.1.0 | Added feature | InlineEditCell component, EDITABLE_CELLS map, Tab navigation, cell flash animation, C/TAP auto-recalc |
| 2026-03-03 | v1.1.0 | UI change | Renamed button to "Set Field Across Selected"; added pencil icon CSS hover cue |
| 2026-03-03 | v1.2.0 | Fixed bug | Channel filter dropdown and logic changed from PROJ_TYPE to CHANNEL_IND |
| 2026-03-03 | v1.2.0 | Created file | CHANGELOG.md — version log with all changes |
| 2026-03-03 | v1.2.0 | Created file | ACTIVITY_LOG.md — activity log by user |
