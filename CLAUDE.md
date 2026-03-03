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

## UI Requirements
- Dark theme, professional look
- Summary cards: Budget TAP, Actual TAP, Budget C/TAP, Actual C/TAP, Total Cost, Approvals
- Filter bar: Identifier, Product, Channel, Client, Approval Status, Director, free-text search
- Sortable data grid with color-coded C/TAP column
- Summary view toggle: product-level rollup with aggregated TAP, cost, C/TAP
- Click-to-open detail panel with tabs: Overview, Performance Chain, Blue Sheet, Export
- Create/Edit modal with auto-calculating C/TAP
- Seed data: actual client names (ADHA, AACN, ASHA, MOAA, Alumni, AOPA, ASME, IEEE) and real AE names (BORSKI, CAPPS, DEVLIN, FOGLE, SASH)
