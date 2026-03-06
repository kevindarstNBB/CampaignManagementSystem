# Campaign Management System

## Overview
Campaign management system for a growth marketing team at a national insurance broker. Manages campaign planning, budgeting, and performance tracking across direct mail, paid digital, email, telesales, and ecommerce channels for association-based insurance products.

## Architecture
React frontend, SharePoint Lists backend via Microsoft Graph API (not connected yet — uses local state with seed data), Power BI reporting layer. MVP runs locally with single-user auth. Scales to Azure AD multi-user.

## Data Model
Flat record mirroring AMBA_ONLY_PIPELINE (59 cols).

### Key Fields
TEAM, NEW_TEAM, TEAM_DESC, CLIENT_DESC, PLAN_CODE, CLIENT, PROD, SYSTEM, ADMIN_IND, CHANNEL_IND, TEST_IND, PROJ_NUM, OPUS, POLICY, AE, MAIL_DATE, IDENTIFIER (ACTUAL/BUDGET/OPERATIONAL), MUTANT (BR/PA/R1/R2), YEAR, QTR, PROJ_TYPE, PRODUCT, DETAIL, GANG_ID, LOB, CARRIER, COMM_TYPE, MAIL_MONTH, MAIL_DAY, LEAD_GEN, LEAD_RATE, PROJ_STATUS, MAIL_QTY, GROSS, GROSS_APP, PEND_APP, ISSUED, REJECTED, NET, NET_APP, AAP, TAP, PAYRATE, COMM, FEE_NET_APP, EXPENSE_REIMBURSEMENT, PROD_CPM, C_TAP, CFT_DIRECTOR, RISK_CODE, PA_ISSUED, PA_APPROVED, DROPPED_IND, TOTAL_PO_AMOUNT, NEW_BY_CARR_TOTAL, NEW_ALL_CARR_TOTAL, NEW_AMBA_TOTAL, MERCER_TOTAL, NEW_TOTAL_COST

### App-Level Fields
_approvalStatus, _blueSheetVersion, _expenseType, _specificExpense, _blueSheetClient, _blueSheetProduct, _monthlyBudget

## Performance Chain
Mail Qty -> Gross Rate -> Gross Apps -> Net Apps -> AAP -> TAP -> Cost -> C/TAP

Formula: C/TAP = NEW_TOTAL_COST / TAP

Color thresholds: green < 5, amber 5-8, red > 8. Auto-calculates when cost or TAP changes.

## Approval Workflow
Draft -> Pending Review -> Approved -> Rejected -> On Hold

Settable per-record and via bulk actions.

## Export Formats

### MOM/Pipeline
All 59 flat fields matching AMBA_ONLY_PIPELINE_2026.xlsx

### Blue Sheet
Version (always "MOM Pipeline"), Expense Type (Direct_Mail/Digital_Marketing/Agent_Leads/Field_Meetings/Field_Promotions/Other_Consumer_Marketing), Specific Expense (GL accounts 65110-65160), Client, Product, Description, Annual Total, 12 monthly budget columns

### Asana
task name=DETAIL, assignee=AE, due_on=MAIL_DATE, section=PROJ_STATUS, custom fields: Product, Client, TAP, C_TAP, Channel, Approval

## Reference Lists

### PROJ_STATUS
NOT STARTED, PROJECT STARTED, IN PROGRESS - PRODUCTION, IN PROGRESS - LOOPING, ONGOING, RESCHEDULED, PROJECT COMPLETE DROPPED, CANCELED

### Expense Types -> GL
- Direct_Mail -> 65110
- Digital_Marketing -> 65120
- Agent_Leads -> 65130
- Field_Meetings -> 65140
- Field_Promotions -> 65150
- Other_Consumer_Marketing -> 65160

### CFT Directors
HILL, HOFFMANN, HULTEN, LAKE, MALLOY, WAGNER, WARDENBURG, WEBB

### Blue Sheet Clients
AMBA Legacy, Alumni, AOPA, ASME, CalBar, IEEE, MOAA, NYSUT, PGA, Allied Health, Non Allied Health, Military-Non MOAA, Mercer Other, Engineers Other, Field, Specialty Lines

### Products (Pipeline -> Blue Sheet)
- PROFESSIONAL LIABILITY -> Proliability
- LIFE -> Life
- DISABILITY -> Disability
- AD&D -> AD&D
- CRITICAL ILLNESS -> Critical Illness

## Current Features

### UI Foundation
- Title: AMBA Marketing Campaign Manager
- Dark theme with CSS custom properties (--bg-primary: #0f1117, --accent: #3b82f6, etc.)
- Fixed viewport-height layout: header + body fill 100vh, data grid fills remaining space with pinned scrollbars
- Summary cards: Budget TAP, Actual TAP, Budget C/TAP (ratio, 3 decimals), Actual C/TAP, Total Cost, Approvals
- Filter bar: Identifier (defaults to BUDGET), Year (multi-select checkboxes), Product, Channel, Channel Detail, Month (Jan-Dec, year-independent), Client, Approval Status, CFT Director, Team, free-text search
- Per-column filters in grid header row: auto-detects enum (dropdown), number (supports >5, <10, 1-100), date (substring), text (substring)
- Sortable data grid with color-coded C/TAP column (green < 5, amber 5-8, red > 8), horizontal scrollbar for many columns
- 4 view modes: Detail Grid, Summary (with YOY), Calendar, Chart
- Click-to-open detail panel (slide-out) with tabs: Overview, Performance Chain, Blue Sheet, Export, History
- Create/Edit modal with auto-calculating C/TAP, GL mapping, quarter derivation from mail date
- Seed data: Full AMBA_ONLY_PIPELINE loaded from `src/pipeline_data.json` (extracted from `O:/Marketing/Shared Reporting/Daily Pipelines/AMBA_ONLY_PIPELINE_2026.xlsx`)

### Excel/CSV Import
- SheetJS (xlsx) library for parsing .xlsx, .xls, .csv files
- Drag-and-drop upload zone or click to browse
- Column mapping: PROJ__ → PROJ_NUM (via IMPORT_COL_MAP)
- Channel normalization: maps abbreviations (D, M, P, E, T, EC, etc.) to full PROJ_TYPE values
- Preview screen: record count, identifier breakdown, top products, sample data table, missing field warnings
- Two import modes: Replace All Data or Append to Existing
- Auto-generates app-level fields (_approvalStatus, _expenseType, _specificExpense, _blueSheetClient, _blueSheetProduct, _monthlyBudget)
- Toast notification on successful import

### Bulk Actions
- Persistent checkbox selection across sort/filter (Set-based ID tracking)
- Select-all checkbox with indeterminate state; Ctrl+A keyboard shortcut
- Bulk approval: set all selected records to any of the 5 approval statuses
- Bulk field editing ("Edit" button): field picker dropdown (13 fields), enum/date/numeric modes (set/multiply/add), before→after preview for first 3 records, auto-recalculation of C/TAP
- Bulk export: MOM Pipeline CSV, Blue Sheet CSV, Asana JSON for selected records
- Deselect all link; selection clears after bulk edit apply

### Inline Cell Editing
- Double-click any editable cell to enter edit mode (single-click on editable cells does NOT open detail pane)
- Editable fields: CFT_DIRECTOR, AE, PROJ_STATUS, PROJ_TYPE, PRODUCT, _approvalStatus, _expenseType (enum); MAIL_QTY, GROSS_APP, NET_APP, AAP, TAP, NEW_TOTAL_COST (number); MAIL_DATE (date); DETAIL, CLIENT_DESC (text)
- Keyboard: Enter to commit, Escape to cancel, Tab/Shift+Tab to move between editable cells in same row
- Auto-recalculation: C/TAP when cost or TAP changes, GL when expense type changes, Blue Sheet product when product changes, QTR/MAIL_MONTH/MAIL_DAY when mail date changes
- Pencil icon hover cue on editable cells; cell flash animation on commit

### Column Visibility & Reordering
- Column picker dropdown with 7 grouped sections: Core, Performance, Project, Approval, Organization, Cost Detail, Flags (40+ total columns)
- 14 default visible columns: Status, Identifier, Client, Product, Channel, Campaign, Mail Qty, TAP, C/TAP, Cost, Proj Status, AE, Director, Mail Date
- Show All / Reset to Default / Reset Order links
- Drag-and-drop column header reordering with visual drop indicator
- Column order persisted to localStorage (survives refresh)
- Display order is independent of export order (PIPELINE_FIELDS is a fixed constant)

### Activity Log / Audit Trail
- User identity: localStorage-persisted username, prompted on first load, changeable via header badge
- Tracks all data mutations: inline edits, modal create/edit, bulk approval, bulk field edit, import (replace/append)
- Log entry schema: id, timestamp, user, action, recordId, recordLabel, changes [{field, oldValue, newValue}], summary, batchId
- Per-record History tab in detail panel: reverse-chronological timeline filtered to that campaign
- Global Activity Log panel (header button): filterable by user, action type, free-text search; bulk operations grouped by batchId (collapsible); Export JSON and Clear Log buttons
- Capped at 1,000 entries, persisted to localStorage

### Three Export Formats
- MOM/Pipeline CSV: all 59 fields in fixed PIPELINE_FIELDS order
- Blue Sheet CSV: budget allocation with monthly columns, GL accounts, expense types
- Asana JSON: task format with custom fields for project management
- Available per-record (Export tab in detail panel) and in bulk (selected records or all filtered)

## Backlog
- SharePoint Lists backend via Microsoft Graph API (replace local state + seed data)
- Azure AD multi-user authentication (replace localStorage username)
- Power BI reporting layer integration
- Undo/redo for edits
- Component file splitting (App.jsx is currently ~2800+ lines single-file)
