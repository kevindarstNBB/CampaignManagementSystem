# Campaign Management System — Version Log

## v1.2.0 — 2026-03-03
### Bug Fix
- **Channel filter**: Changed from `PROJ_TYPE` to `CHANNEL_IND` for dropdown options and filter logic so the Channel filter shows actual channels (Direct Mail, Paid Digital, etc.) instead of project types (NEW, RENEWAL, REISSUE)

## v1.1.0 — 2026-03-03
### Bug Fixes
- **Client filter**: Switched from static `CLIENT_NAMES` array to dynamic unique `CLIENT_DESC` values from loaded data
- **Channel filter**: Switched from static `CHANNELS` array to data-driven dropdown (was filtering on wrong field)
- **Search crash**: Wrapped all search fields with `String(field ?? '').toLowerCase()` to handle null/numeric values; added PRODUCT to searchable fields
- **Summary card formatting**: Budget/Actual TAP now display with `$` currency formatting; C/TAP displays as ratio with 3 decimal places

### Features
- **Column visibility toggle**: 40+ columns in COLUMN_REGISTRY, 7 grouped sections in ColumnPicker dropdown, 14 default visible columns, Show All / Reset to Default
- **Inline cell editing**: Double-click to edit, Enter/Tab/Escape keyboard handling, Tab advances to next editable cell, auto-recalculation of C/TAP, cell flash animation
- **Bulk field editing**: "Set Field Across Selected" modal with field picker (13 fields), enum/date/numeric modes (set/multiply/add), before→after preview, auto-recalculation of C/TAP
- **Renamed Bulk Edit button** to "Set Field Across Selected"; added pencil icon hover cue on editable cells

## v1.0.0 — 2026-03-03
### Initial Release
- React + Vite single-page application
- Dark theme UI with CSS custom properties
- **Summary cards**: Total Campaigns, Budget TAP, Actual TAP, Avg C/TAP, Approved count
- **Filter bar**: Identifier (default BUDGET), Product, Channel, Client, Approval Status, CFT Director, Search
- **Sortable data grid**: Click column headers to sort asc/desc
- **Detail panel**: 4 tabs — Overview, Performance Chain, Blue Sheet, Export
- **Create/Edit modal**: Full form for all campaign fields
- **Excel/CSV import**: SheetJS-based, drag-and-drop, column mapping (PROJ__ → PROJ_NUM), preview with row count, Replace/Append modes, toast notification
- **Bulk approval**: Select rows via checkboxes, set approval status (Draft, Pending Review, Approved, Rejected, On Hold), Ctrl+A select all, persistent selection through filtering
- **Three export formats**: Pipeline CSV (59 columns), Blue Sheet CSV (monthly budget), Asana JSON
- **Approval workflow**: Draft → Pending Review → Approved → Rejected → On Hold
- **Performance chain visualization**: Mail Qty → Gross Rate → Gross Apps → Net Apps → AAP → TAP → Cost → C/TAP
- **Seed data**: 30 randomized campaign records for development/demo
- **Dependencies**: react, react-dom, lodash, xlsx (SheetJS)
