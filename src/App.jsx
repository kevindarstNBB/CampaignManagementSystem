import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import _ from 'lodash';
import * as XLSX from 'xlsx';
import './App.css';

// ─── Reference Data ───────────────────────────────────────────────────────────

const PROJ_STATUSES = [
  'NOT STARTED','PROJECT STARTED','IN PROGRESS - PRODUCTION','IN PROGRESS - LOOPING',
  'ONGOING','RESCHEDULED','PROJECT COMPLETE','DROPPED','CANCELED'
];
const CFT_DIRECTORS = ['HILL','HOFFMANN','HULTEN','LAKE','MALLOY','WAGNER','WARDENBURG','WEBB'];
const APPROVAL_STATUSES = ['Draft','Pending Review','Approved','Rejected','On Hold'];
const IDENTIFIERS = ['ACTUAL','BUDGET','OPERATIONAL'];
const MUTANTS = ['BR','PA','R1','R2'];
const PRODUCTS = ['PROFESSIONAL LIABILITY','LIFE','DISABILITY','AD&D','CRITICAL ILLNESS'];
const CHANNELS = ['DIRECT MAIL','PAID DIGITAL','EMAIL','TELESALES','ECOMMERCE'];
const AE_NAMES = ['BORSKI','CAPPS','DEVLIN','FOGLE','SASH'];
const CLIENT_NAMES = ['ADHA','AACN','ASHA','MOAA','Alumni','AOPA','ASME','IEEE'];
const EXPENSE_TYPES = ['Direct_Mail','Digital_Marketing','Agent_Leads','Field_Meetings','Field_Promotions','Other_Consumer_Marketing'];
const GL_MAP = { Direct_Mail:'65110', Digital_Marketing:'65120', Agent_Leads:'65130', Field_Meetings:'65140', Field_Promotions:'65150', Other_Consumer_Marketing:'65160' };
const BLUE_SHEET_CLIENTS = ['AMBA Legacy','Alumni','AOPA','ASME','CalBar','IEEE','MOAA','NYSUT','PGA','Allied Health','Non Allied Health','Military-Non MOAA','Mercer Other','Engineers Other','Field','Specialty Lines'];
const PRODUCT_MAP = { 'PROFESSIONAL LIABILITY':'Proliability','LIFE':'Life','DISABILITY':'Disability','AD&D':'AD&D','CRITICAL ILLNESS':'Critical Illness' };
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Seed Data ────────────────────────────────────────────────────────────────

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = (lo, hi) => Math.floor(Math.random() * (hi - lo + 1)) + lo;
const fmtMoney = v => v == null ? '—' : '$' + Number(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDec = (v, d = 2) => v == null ? '—' : Number(v).toFixed(d);

function generateSeed(n = 30) {
  const rows = [];
  for (let i = 0; i < n; i++) {
    const mailQty = randInt(5000, 120000);
    const grossRate = (Math.random() * 0.04 + 0.01);
    const grossApp = Math.round(mailQty * grossRate);
    const netApp = Math.round(grossApp * (Math.random() * 0.3 + 0.6));
    const aap = Math.round(netApp * (Math.random() * 0.3 + 0.5));
    const tap = Math.round(aap * (Math.random() * 0.4 + 0.5));
    const cost = randInt(8000, 200000);
    const ctap = tap > 0 ? cost / tap : 0;
    const identifier = pick(IDENTIFIERS);
    const product = pick(PRODUCTS);
    const client = pick(CLIENT_NAMES);
    const ae = pick(AE_NAMES);
    const channel = pick(CHANNELS);
    const expType = pick(EXPENSE_TYPES);
    const mailMonth = randInt(1, 12);
    const mailDay = randInt(1, 28);
    const bsClient = pick(BLUE_SHEET_CLIENTS);
    const monthly = Array.from({ length: 12 }, () => randInt(0, Math.round(cost / 8)));
    const annualTotal = monthly.reduce((a, b) => a + b, 0);

    rows.push({
      id: i + 1,
      TEAM: 'GROWTH', NEW_TEAM: 'GROWTH MKT', TEAM_DESC: 'Growth Marketing',
      CLIENT_DESC: client, PLAN_CODE: `PC${randInt(100,999)}`, CLIENT: client.substring(0,4).toUpperCase(),
      PROD: product.substring(0,4).toUpperCase(), SYSTEM: 'EPIC', ADMIN_IND: pick(['Y','N']),
      CHANNEL_IND: channel, TEST_IND: pick(['Y','N']), PROJ_NUM: `P-${2026}-${String(i+1).padStart(3,'0')}`,
      OPUS: `OP${randInt(1000,9999)}`, POLICY: `POL${randInt(10000,99999)}`, AE: ae,
      MAIL_DATE: `2026-${String(mailMonth).padStart(2,'0')}-${String(mailDay).padStart(2,'0')}`,
      IDENTIFIER: identifier, MUTANT: pick(MUTANTS), YEAR: 2026, QTR: `Q${Math.ceil(mailMonth/3)}`,
      PROJ_TYPE: pick(['NEW','RENEWAL','REISSUE']), PRODUCT: product,
      DETAIL: `${client} ${product} ${channel} ${pick(['Spring','Summer','Fall','Winter'])} Campaign`,
      GANG_ID: `G${randInt(100,999)}`, LOB: 'P&C', CARRIER: pick(['CARRIER_A','CARRIER_B','CARRIER_C']),
      COMM_TYPE: pick(['COMMISSION','FEE']), MAIL_MONTH: mailMonth, MAIL_DAY: mailDay,
      LEAD_GEN: pick(['Y','N']), LEAD_RATE: (Math.random() * 0.05).toFixed(4),
      PROJ_STATUS: pick(PROJ_STATUSES), MAIL_QTY: mailQty, GROSS: grossRate,
      GROSS_APP: grossApp, PEND_APP: randInt(0, Math.round(grossApp * 0.1)),
      ISSUED: randInt(0, netApp), REJECTED: randInt(0, Math.round(grossApp * 0.15)),
      NET: (netApp / mailQty), NET_APP: netApp, AAP: aap, TAP: tap,
      PAYRATE: (Math.random() * 0.15 + 0.05).toFixed(4), COMM: randInt(1000, 50000),
      FEE_NET_APP: randInt(0, 5000), EXPENSE_REIMBURSEMENT: randInt(0, 3000),
      PROD_CPM: (cost / mailQty * 1000).toFixed(2), C_TAP: ctap,
      CFT_DIRECTOR: pick(CFT_DIRECTORS), RISK_CODE: `RC${randInt(10,99)}`,
      PA_ISSUED: pick(['Y','N']), PA_APPROVED: pick(['Y','N']),
      DROPPED_IND: pick(['Y','N','N','N']), TOTAL_PO_AMOUNT: randInt(5000, 100000),
      NEW_BY_CARR_TOTAL: randInt(5000, 80000), NEW_ALL_CARR_TOTAL: randInt(10000, 150000),
      NEW_AMBA_TOTAL: randInt(5000, 60000), MERCER_TOTAL: randInt(0, 30000),
      NEW_TOTAL_COST: cost,
      // App-level fields
      _approvalStatus: pick(APPROVAL_STATUSES),
      _blueSheetVersion: 'MOM Pipeline',
      _expenseType: expType,
      _specificExpense: GL_MAP[expType],
      _blueSheetClient: bsClient,
      _blueSheetProduct: PRODUCT_MAP[product] || product,
      _monthlyBudget: monthly,
    });
  }
  return rows;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ctapClass(v) {
  if (v == null || v === 0) return '';
  if (v < 5) return 'ctap-green';
  if (v <= 8) return 'ctap-amber';
  return 'ctap-red';
}

function approvalBadge(status) {
  const cls = { 'Draft':'badge-draft','Pending Review':'badge-pending','Approved':'badge-approved','Rejected':'badge-rejected','On Hold':'badge-hold' };
  return <span className={`badge ${cls[status] || 'badge-draft'}`}>{status}</span>;
}

function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => {
    const v = r[k];
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s;
  }).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadJSON(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// Pipeline export fields (59 cols)
const PIPELINE_FIELDS = [
  'TEAM','NEW_TEAM','TEAM_DESC','CLIENT_DESC','PLAN_CODE','CLIENT','PROD','SYSTEM','ADMIN_IND',
  'CHANNEL_IND','TEST_IND','PROJ_NUM','OPUS','POLICY','AE','MAIL_DATE','IDENTIFIER','MUTANT',
  'YEAR','QTR','PROJ_TYPE','PRODUCT','DETAIL','GANG_ID','LOB','CARRIER','COMM_TYPE','MAIL_MONTH',
  'MAIL_DAY','LEAD_GEN','LEAD_RATE','PROJ_STATUS','MAIL_QTY','GROSS','GROSS_APP','PEND_APP',
  'ISSUED','REJECTED','NET','NET_APP','AAP','TAP','PAYRATE','COMM','FEE_NET_APP',
  'EXPENSE_REIMBURSEMENT','PROD_CPM','C_TAP','CFT_DIRECTOR','RISK_CODE','PA_ISSUED','PA_APPROVED',
  'DROPPED_IND','TOTAL_PO_AMOUNT','NEW_BY_CARR_TOTAL','NEW_ALL_CARR_TOTAL','NEW_AMBA_TOTAL',
  'MERCER_TOTAL','NEW_TOTAL_COST'
];

// ─── Import Helpers ───────────────────────────────────────────────────────────

// The source spreadsheet uses PROJ__ as the header for what we call PROJ_NUM
const IMPORT_COL_MAP = { 'PROJ__': 'PROJ_NUM' };

function inferExpenseType(projType, detail) {
  const s = ((projType || '') + ' ' + (detail || '')).toUpperCase();
  if (s.includes('DIGITAL') || s.includes('BANNER') || s.includes('SOCIAL MEDIA')) return 'Digital_Marketing';
  if (s.includes('TELEMARKETING')) return 'Agent_Leads';
  return 'Direct_Mail';
}

function mapBlueSheetClient(clientDesc) {
  if (!clientDesc) return 'Other';
  const upper = clientDesc.toUpperCase();
  const match = BLUE_SHEET_CLIENTS.find(c => upper.includes(c.toUpperCase()));
  // Also check common abbreviations
  if (match) return match;
  if (upper.includes('ALUMNI')) return 'Alumni';
  if (upper.includes('AOPA')) return 'AOPA';
  if (upper.includes('ASME')) return 'ASME';
  if (upper.includes('IEEE')) return 'IEEE';
  if (upper.includes('MOAA')) return 'MOAA';
  if (upper.includes('CALBAR')) return 'CalBar';
  if (upper.includes('NYSUT')) return 'NYSUT';
  if (upper.includes('PGA')) return 'PGA';
  if (upper.includes('AMBA')) return 'AMBA Legacy';
  if (upper.includes('MERCER')) return 'Mercer Other';
  return 'Other';
}

function processImportedRows(rawRows, startId) {
  return rawRows.map((raw, idx) => {
    // Map columns (handle PROJ__ -> PROJ_NUM etc.)
    const mapped = {};
    Object.entries(raw).forEach(([key, val]) => {
      const k = IMPORT_COL_MAP[key] || key;
      mapped[k] = val;
    });

    const cost = Number(mapped.NEW_TOTAL_COST) || 0;
    const tap = Number(mapped.TAP) || 0;
    const mailMonth = Number(mapped.MAIL_MONTH) || 1;
    const expType = inferExpenseType(mapped.PROJ_TYPE, mapped.DETAIL);
    const product = mapped.PRODUCT || '';

    // Build monthly budget: full cost in MAIL_MONTH, zeros elsewhere
    const monthly = Array(12).fill(0);
    if (mailMonth >= 1 && mailMonth <= 12) monthly[mailMonth - 1] = cost;

    return {
      // Pipeline fields with numeric coercion where needed
      TEAM: mapped.TEAM || '',
      NEW_TEAM: mapped.NEW_TEAM || '',
      TEAM_DESC: mapped.TEAM_DESC || '',
      CLIENT_DESC: mapped.CLIENT_DESC || '',
      PLAN_CODE: mapped.PLAN_CODE || '',
      CLIENT: mapped.CLIENT || '',
      PROD: mapped.PROD || '',
      SYSTEM: mapped.SYSTEM || '',
      ADMIN_IND: mapped.ADMIN_IND || '',
      CHANNEL_IND: mapped.CHANNEL_IND || '',
      TEST_IND: mapped.TEST_IND || '',
      PROJ_NUM: mapped.PROJ_NUM || `IMP-${String(startId + idx).padStart(4, '0')}`,
      OPUS: mapped.OPUS || '',
      POLICY: mapped.POLICY || '',
      AE: mapped.AE || '',
      MAIL_DATE: mapped.MAIL_DATE || '',
      IDENTIFIER: mapped.IDENTIFIER || '',
      MUTANT: mapped.MUTANT || '',
      YEAR: Number(mapped.YEAR) || 2026,
      QTR: mapped.QTR || '',
      PROJ_TYPE: mapped.PROJ_TYPE || '',
      PRODUCT: product,
      DETAIL: mapped.DETAIL || '',
      GANG_ID: mapped.GANG_ID || '',
      LOB: mapped.LOB || '',
      CARRIER: mapped.CARRIER || '',
      COMM_TYPE: mapped.COMM_TYPE || '',
      MAIL_MONTH: mailMonth,
      MAIL_DAY: Number(mapped.MAIL_DAY) || 1,
      LEAD_GEN: mapped.LEAD_GEN || '',
      LEAD_RATE: mapped.LEAD_RATE || 0,
      PROJ_STATUS: mapped.PROJ_STATUS || 'NOT STARTED',
      MAIL_QTY: Number(mapped.MAIL_QTY) || 0,
      GROSS: Number(mapped.GROSS) || 0,
      GROSS_APP: Number(mapped.GROSS_APP) || 0,
      PEND_APP: Number(mapped.PEND_APP) || 0,
      ISSUED: Number(mapped.ISSUED) || 0,
      REJECTED: Number(mapped.REJECTED) || 0,
      NET: Number(mapped.NET) || 0,
      NET_APP: Number(mapped.NET_APP) || 0,
      AAP: Number(mapped.AAP) || 0,
      TAP: tap,
      PAYRATE: mapped.PAYRATE || 0,
      COMM: Number(mapped.COMM) || 0,
      FEE_NET_APP: Number(mapped.FEE_NET_APP) || 0,
      EXPENSE_REIMBURSEMENT: Number(mapped.EXPENSE_REIMBURSEMENT) || 0,
      PROD_CPM: mapped.PROD_CPM || '0.00',
      C_TAP: tap > 0 ? cost / tap : 0,
      CFT_DIRECTOR: mapped.CFT_DIRECTOR || '',
      RISK_CODE: mapped.RISK_CODE || '',
      PA_ISSUED: mapped.PA_ISSUED || '',
      PA_APPROVED: mapped.PA_APPROVED || '',
      DROPPED_IND: mapped.DROPPED_IND || '',
      TOTAL_PO_AMOUNT: Number(mapped.TOTAL_PO_AMOUNT) || 0,
      NEW_BY_CARR_TOTAL: Number(mapped.NEW_BY_CARR_TOTAL) || 0,
      NEW_ALL_CARR_TOTAL: Number(mapped.NEW_ALL_CARR_TOTAL) || 0,
      NEW_AMBA_TOTAL: Number(mapped.NEW_AMBA_TOTAL) || 0,
      MERCER_TOTAL: Number(mapped.MERCER_TOTAL) || 0,
      NEW_TOTAL_COST: cost,
      // Auto-generated app-level fields
      id: startId + idx,
      _approvalStatus: 'Draft',
      _blueSheetVersion: 'MOM Pipeline',
      _expenseType: expType,
      _specificExpense: GL_MAP[expType] || '65110',
      _blueSheetClient: mapBlueSheetClient(mapped.CLIENT_DESC),
      _blueSheetProduct: PRODUCT_MAP[product] || product,
      _monthlyBudget: monthly,
    };
  });
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryCards({ data }) {
  const budgetRows = data.filter(r => r.IDENTIFIER === 'BUDGET');
  const actualRows = data.filter(r => r.IDENTIFIER === 'ACTUAL');
  const budgetTAP = _.sumBy(budgetRows, 'TAP');
  const actualTAP = _.sumBy(actualRows, 'TAP');
  const budgetCost = _.sumBy(budgetRows, 'NEW_TOTAL_COST');
  const actualCost = _.sumBy(actualRows, 'NEW_TOTAL_COST');
  const budgetCTAP = budgetTAP > 0 ? budgetCost / budgetTAP : 0;
  const actualCTAP = actualTAP > 0 ? actualCost / actualTAP : 0;
  const totalCost = _.sumBy(data, 'NEW_TOTAL_COST');
  const approved = data.filter(r => r._approvalStatus === 'Approved').length;
  const pending = data.filter(r => r._approvalStatus === 'Pending Review').length;

  const cards = [
    { label: 'Budget TAP', value: fmtMoney(budgetTAP), sub: `${budgetRows.length} budget records` },
    { label: 'Actual TAP', value: fmtMoney(actualTAP), sub: `${actualRows.length} actual records` },
    { label: 'Budget C/TAP', value: budgetCTAP.toFixed(3), sub: fmtMoney(budgetCost) + ' total cost', cls: ctapClass(budgetCTAP) },
    { label: 'Actual C/TAP', value: actualCTAP.toFixed(3), sub: fmtMoney(actualCost) + ' total cost', cls: ctapClass(actualCTAP) },
    { label: 'Total Cost', value: fmtMoney(totalCost), sub: `${data.length} campaigns` },
    { label: 'Approvals', value: `${approved}/${data.length}`, sub: `${pending} pending review` },
  ];
  return (
    <div className="summary-cards">
      {cards.map((c, i) => (
        <div className="summary-card" key={i}>
          <div className="label">{c.label}</div>
          <div className={`value ${c.cls || ''}`}>{c.value}</div>
          <div className="sub">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

function FilterBar({ filters, setFilters, data }) {
  const set = (k, v) => setFilters(prev => ({ ...prev, [k]: v }));
  // Derive unique values from actual data for client and channel
  const uniqueClients = useMemo(() => _.sortBy(_.uniq(data.map(r => r.CLIENT_DESC).filter(Boolean))), [data]);
  const uniqueChannels = useMemo(() => _.sortBy(_.uniq(data.map(r => r.PROJ_TYPE).filter(Boolean))), [data]);
  return (
    <div className="filter-bar">
      <select value={filters.identifier} onChange={e => set('identifier', e.target.value)}>
        <option value="">All Identifiers</option>
        {IDENTIFIERS.map(v => <option key={v}>{v}</option>)}
      </select>
      <select value={filters.product} onChange={e => set('product', e.target.value)}>
        <option value="">All Products</option>
        {PRODUCTS.map(v => <option key={v}>{v}</option>)}
      </select>
      <select value={filters.channel} onChange={e => set('channel', e.target.value)}>
        <option value="">All Channels</option>
        {uniqueChannels.map(v => <option key={v}>{v}</option>)}
      </select>
      <select value={filters.client} onChange={e => set('client', e.target.value)}>
        <option value="">All Clients</option>
        {uniqueClients.map(v => <option key={v}>{v}</option>)}
      </select>
      <select value={filters.approval} onChange={e => set('approval', e.target.value)}>
        <option value="">All Statuses</option>
        {APPROVAL_STATUSES.map(v => <option key={v}>{v}</option>)}
      </select>
      <select value={filters.director} onChange={e => set('director', e.target.value)}>
        <option value="">All Directors</option>
        {CFT_DIRECTORS.map(v => <option key={v}>{v}</option>)}
      </select>
      <div className="filter-spacer" />
      <input type="text" placeholder="Search campaigns..." value={filters.search} onChange={e => set('search', e.target.value)} />
    </div>
  );
}

// ─── Column Definitions ───────────────────────────────────────────────────────

const COLUMN_REGISTRY = {
  _approvalStatus: { label: 'Status', fmt: v => approvalBadge(v) },
  IDENTIFIER: { label: 'Identifier' },
  CLIENT_DESC: { label: 'Client' },
  PRODUCT: { label: 'Product' },
  PROJ_TYPE: { label: 'Channel' },
  DETAIL: { label: 'Campaign' },
  MUTANT: { label: 'Mutant' },
  MAIL_QTY: { label: 'Mail Qty', fmt: v => v != null ? Number(v).toLocaleString() : '—' },
  GROSS: { label: 'Gross Rate', fmt: v => v != null ? (Number(v) * 100).toFixed(2) + '%' : '—' },
  GROSS_APP: { label: 'Gross Apps', fmt: v => v != null ? Number(v).toLocaleString() : '—' },
  NET_APP: { label: 'Net Apps', fmt: v => v != null ? Number(v).toLocaleString() : '—' },
  AAP: { label: 'AAP', fmt: v => v != null ? Number(v).toLocaleString() : '—' },
  TAP: { label: 'TAP', fmt: v => v != null ? Number(v).toLocaleString() : '—' },
  C_TAP: { label: 'C/TAP', fmt: v => v != null ? `$${Number(v).toFixed(2)}` : '—', cls: r => ctapClass(r.C_TAP) },
  NEW_TOTAL_COST: { label: 'Cost', fmt: v => fmtMoney(v) },
  PROJ_NUM: { label: 'Project #' },
  PROJ_STATUS: { label: 'Proj Status' },
  AE: { label: 'AE' },
  CFT_DIRECTOR: { label: 'Director' },
  MAIL_DATE: { label: 'Mail Date' },
  YEAR: { label: 'Year' },
  QTR: { label: 'Quarter' },
  PA_ISSUED: { label: 'PA Issued' },
  PA_APPROVED: { label: 'PA Approved' },
  TEAM_DESC: { label: 'Team' },
  CARRIER: { label: 'Carrier' },
  LOB: { label: 'LOB' },
  GANG_ID: { label: 'Gang ID' },
  COMM_TYPE: { label: 'Comm Type' },
  RISK_CODE: { label: 'Risk Code' },
  CHANNEL_IND: { label: 'Channel Ind' },
  TOTAL_PO_AMOUNT: { label: 'PO Amount', fmt: v => fmtMoney(v) },
  PAYRATE: { label: 'Pay Rate', fmt: v => v != null ? (Number(v) * 100).toFixed(2) + '%' : '—' },
  COMM: { label: 'Commission', fmt: v => fmtMoney(v) },
  FEE_NET_APP: { label: 'Fee/Net App', fmt: v => fmtMoney(v) },
  EXPENSE_REIMBURSEMENT: { label: 'Expense Reimb', fmt: v => fmtMoney(v) },
  PROD_CPM: { label: 'Prod CPM', fmt: v => v != null ? `$${v}` : '—' },
  NEW_BY_CARR_TOTAL: { label: 'By Carrier Total', fmt: v => fmtMoney(v) },
  NEW_ALL_CARR_TOTAL: { label: 'All Carrier Total', fmt: v => fmtMoney(v) },
  NEW_AMBA_TOTAL: { label: 'AMBA Total', fmt: v => fmtMoney(v) },
  MERCER_TOTAL: { label: 'Mercer Total', fmt: v => fmtMoney(v) },
  ADMIN_IND: { label: 'Admin' },
  TEST_IND: { label: 'Test' },
  DROPPED_IND: { label: 'Dropped' },
};

const COLUMN_GROUPS = [
  { name: 'Core', keys: ['CLIENT_DESC','PRODUCT','PROJ_TYPE','DETAIL','IDENTIFIER','MUTANT'] },
  { name: 'Performance', keys: ['MAIL_QTY','GROSS','GROSS_APP','NET_APP','AAP','TAP','C_TAP','NEW_TOTAL_COST'] },
  { name: 'Project', keys: ['PROJ_NUM','PROJ_STATUS','AE','CFT_DIRECTOR','MAIL_DATE','YEAR','QTR'] },
  { name: 'Approval', keys: ['_approvalStatus','PA_ISSUED','PA_APPROVED'] },
  { name: 'Organization', keys: ['TEAM_DESC','CARRIER','LOB','GANG_ID','COMM_TYPE','RISK_CODE','CHANNEL_IND'] },
  { name: 'Cost Detail', keys: ['TOTAL_PO_AMOUNT','PAYRATE','COMM','FEE_NET_APP','EXPENSE_REIMBURSEMENT','PROD_CPM','NEW_BY_CARR_TOTAL','NEW_ALL_CARR_TOTAL','NEW_AMBA_TOTAL','MERCER_TOTAL'] },
  { name: 'Flags', keys: ['ADMIN_IND','TEST_IND','DROPPED_IND'] },
];

// Inline edit definitions: which cells are editable and how
const EDITABLE_CELLS = {
  CFT_DIRECTOR: { type: 'enum', options: CFT_DIRECTORS },
  AE: { type: 'enum', options: AE_NAMES },
  PROJ_STATUS: { type: 'enum', options: PROJ_STATUSES },
  PROJ_TYPE: { type: 'enum', options: ['NEW','RENEWAL','REISSUE'] },
  PRODUCT: { type: 'enum', options: PRODUCTS },
  _approvalStatus: { type: 'enum', options: APPROVAL_STATUSES },
  _expenseType: { type: 'enum', options: EXPENSE_TYPES },
  MAIL_QTY: { type: 'number' },
  GROSS_APP: { type: 'number' },
  NET_APP: { type: 'number' },
  AAP: { type: 'number' },
  TAP: { type: 'number' },
  NEW_TOTAL_COST: { type: 'number' },
  MAIL_DATE: { type: 'date' },
  DETAIL: { type: 'text' },
  CLIENT_DESC: { type: 'text' },
};

const DEFAULT_VISIBLE_COLS = new Set([
  '_approvalStatus','IDENTIFIER','CLIENT_DESC','PRODUCT','PROJ_TYPE','DETAIL',
  'MAIL_QTY','TAP','C_TAP','NEW_TOTAL_COST','PROJ_STATUS','AE','CFT_DIRECTOR','MAIL_DATE',
]);

function ColumnPicker({ visibleCols, setVisibleCols }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleCol = (key) => {
    const next = new Set(visibleCols);
    next.has(key) ? next.delete(key) : next.add(key);
    setVisibleCols(next);
  };

  const allKeys = COLUMN_GROUPS.flatMap(g => g.keys);

  return (
    <div className="col-picker-wrap" ref={panelRef}>
      <button className={`btn btn-sm ${open ? 'btn-primary' : ''}`} onClick={() => setOpen(!open)}>Columns</button>
      {open && (
        <div className="col-picker-panel">
          <div className="col-picker-body">
            {COLUMN_GROUPS.map(g => (
              <div key={g.name} className="col-picker-group">
                <div className="col-picker-group-label">{g.name}</div>
                {g.keys.map(key => (
                  <label key={key} className="col-picker-item">
                    <input type="checkbox" checked={visibleCols.has(key)} onChange={() => toggleCol(key)} />
                    <span>{COLUMN_REGISTRY[key]?.label || key}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <div className="col-picker-footer">
            <button className="col-picker-link" onClick={() => setVisibleCols(new Set(allKeys))}>Show All</button>
            <button className="col-picker-link" onClick={() => setVisibleCols(new Set(DEFAULT_VISIBLE_COLS))}>Reset to Default</button>
          </div>
        </div>
      )}
    </div>
  );
}

function InlineEditCell({ value, editDef, onCommit, onCancel, onTab }) {
  const [draft, setDraft] = useState(editDef.type === 'number' ? (Number(value) || 0) : (value ?? ''));
  const inputRef = useRef(null);

  useEffect(() => {
    const el = inputRef.current;
    if (el) { el.focus(); if (el.select) el.select(); }
  }, []);

  const commit = () => onCommit(editDef.type === 'number' ? Number(draft) || 0 : draft);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    else if (e.key === 'Escape') { e.preventDefault(); onCancel(); }
    else if (e.key === 'Tab') { e.preventDefault(); commit(); onTab(e.shiftKey ? -1 : 1); }
  };

  if (editDef.type === 'enum') {
    return (
      <select ref={inputRef} className="inline-edit-input" value={draft} onChange={e => { setDraft(e.target.value); }}
        onKeyDown={handleKeyDown} onBlur={commit}>
        {editDef.options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (editDef.type === 'date') {
    return <input ref={inputRef} className="inline-edit-input" type="date" value={draft} onChange={e => setDraft(e.target.value)}
      onKeyDown={handleKeyDown} onBlur={commit} />;
  }
  if (editDef.type === 'number') {
    return <input ref={inputRef} className="inline-edit-input" type="number" value={draft} onChange={e => setDraft(e.target.value)}
      onKeyDown={handleKeyDown} onBlur={commit} />;
  }
  // text
  return <input ref={inputRef} className="inline-edit-input" type="text" value={draft} onChange={e => setDraft(e.target.value)}
    onKeyDown={handleKeyDown} onBlur={commit} />;
}

function DataGrid({ data, sort, setSort, selectedIds, setSelectedIds, onRowClick, visibleCols, onCellEdit }) {
  const gridRef = useRef(null);
  const headerCheckRef = useRef(null);
  // editingCell: { rowId, colKey } or null
  const [editingCell, setEditingCell] = useState(null);
  // flashCell: { rowId, colKey } for the brief highlight after edit
  const [flashCell, setFlashCell] = useState(null);

  const toggle = field => {
    if (sort.field === field) setSort({ field, dir: sort.dir === 'asc' ? 'desc' : 'asc' });
    else setSort({ field, dir: 'asc' });
  };
  const arrow = field => sort.field === field ? (sort.dir === 'asc' ? ' ▲' : ' ▼') : '';

  // Select-all operates only on visible/filtered rows, preserving off-screen selections
  const visibleIds = useMemo(() => new Set(data.map(r => r.id)), [data]);
  const visibleSelectedCount = useMemo(() => {
    let count = 0;
    for (const id of selectedIds) { if (visibleIds.has(id)) count++; }
    return count;
  }, [selectedIds, visibleIds]);
  const allVisibleSelected = data.length > 0 && visibleSelectedCount === data.length;
  const someVisibleSelected = visibleSelectedCount > 0 && !allVisibleSelected;

  useEffect(() => {
    if (headerCheckRef.current) headerCheckRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  const toggleAll = () => {
    const next = new Set(selectedIds);
    if (allVisibleSelected) { for (const id of visibleIds) next.delete(id); }
    else { for (const id of visibleIds) next.add(id); }
    setSelectedIds(next);
  };

  const toggleOne = id => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
      e.preventDefault();
      const next = new Set(selectedIds);
      for (const id of visibleIds) next.add(id);
      setSelectedIds(next);
    }
  };

  const cols = useMemo(() => {
    const ordered = COLUMN_GROUPS.flatMap(g => g.keys);
    return ordered.filter(key => visibleCols.has(key)).map(key => ({ key, ...COLUMN_REGISTRY[key] }));
  }, [visibleCols]);

  const commitEdit = useCallback((rowId, colKey, newValue) => {
    setEditingCell(null);
    const row = data.find(r => r.id === rowId);
    if (!row || row[colKey] === newValue) return;
    onCellEdit(rowId, colKey, newValue);
    setFlashCell({ rowId, colKey });
    setTimeout(() => setFlashCell(null), 600);
  }, [data, onCellEdit]);

  const handleTab = useCallback((rowId, colKey, direction) => {
    // Find the next editable column in this row
    const editableInOrder = cols.filter(c => EDITABLE_CELLS[c.key]);
    const curIdx = editableInOrder.findIndex(c => c.key === colKey);
    const nextIdx = curIdx + direction;
    if (nextIdx >= 0 && nextIdx < editableInOrder.length) {
      setEditingCell({ rowId, colKey: editableInOrder[nextIdx].key });
    } else {
      setEditingCell(null);
    }
  }, [cols]);

  const handleCellDoubleClick = (e, rowId, colKey) => {
    if (!EDITABLE_CELLS[colKey]) return;
    e.stopPropagation();
    setEditingCell({ rowId, colKey });
  };

  const isEditing = (rowId, colKey) => editingCell && editingCell.rowId === rowId && editingCell.colKey === colKey;
  const isFlashing = (rowId, colKey) => flashCell && flashCell.rowId === rowId && flashCell.colKey === colKey;

  return (
    <div className="data-grid-wrap" ref={gridRef} tabIndex={0} onKeyDown={handleKeyDown}>
      <table className="data-grid">
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input type="checkbox" ref={headerCheckRef} checked={allVisibleSelected} onChange={toggleAll} />
            </th>
            {cols.map(c => (
              <th key={c.key} onClick={() => toggle(c.key)}>
                {c.label}<span className="sort-arrow">{arrow(c.key)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
            <tr key={row.id} className={selectedIds.has(row.id) ? 'selected' : ''} onClick={() => { if (!editingCell) onRowClick(row); }} style={{ cursor: 'pointer' }}>
              <td onClick={e => e.stopPropagation()}>
                <input type="checkbox" checked={selectedIds.has(row.id)} onChange={() => toggleOne(row.id)} />
              </td>
              {cols.map(c => {
                const editing = isEditing(row.id, c.key);
                const flashing = isFlashing(row.id, c.key);
                const editable = !!EDITABLE_CELLS[c.key];
                return (
                  <td key={c.key}
                    className={`${c.cls ? c.cls(row) : ''} ${flashing ? 'cell-flash' : ''} ${editable ? 'cell-editable' : ''}`}
                    onDoubleClick={e => handleCellDoubleClick(e, row.id, c.key)}
                    onClick={editing ? e => e.stopPropagation() : undefined}
                  >
                    {editing ? (
                      <InlineEditCell
                        value={row[c.key]}
                        editDef={EDITABLE_CELLS[c.key]}
                        onCommit={(val) => commitEdit(row.id, c.key, val)}
                        onCancel={() => setEditingCell(null)}
                        onTab={(dir) => handleTab(row.id, c.key, dir)}
                      />
                    ) : (
                      c.fmt ? c.fmt(row[c.key], row) : (row[c.key] ?? '—')
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
          {data.length === 0 && <tr><td colSpan={cols.length + 1} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No campaigns match your filters</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function SummaryView({ data }) {
  const groups = _.groupBy(data, 'PRODUCT');
  const rows = Object.entries(groups).map(([product, items]) => {
    const tap = _.sumBy(items, 'TAP');
    const cost = _.sumBy(items, 'NEW_TOTAL_COST');
    const ctap = tap > 0 ? cost / tap : 0;
    return { product, count: items.length, tap, cost, ctap };
  }).sort((a, b) => b.cost - a.cost);

  return (
    <div className="summary-table-wrap">
      <table className="summary-table">
        <thead>
          <tr>
            <th>Product</th><th>Campaigns</th><th>Total TAP</th><th>Total Cost</th><th>Avg C/TAP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.product}>
              <td>{r.product}</td>
              <td>{r.count}</td>
              <td>{r.tap.toLocaleString()}</td>
              <td>{fmtMoney(r.cost)}</td>
              <td className={ctapClass(r.ctap)}>${r.ctap.toFixed(2)}</td>
            </tr>
          ))}
          {rows.length > 0 && (
            <tr style={{ fontWeight: 600 }}>
              <td>TOTAL</td>
              <td>{_.sumBy(rows, 'count')}</td>
              <td>{_.sumBy(rows, 'tap').toLocaleString()}</td>
              <td>{fmtMoney(_.sumBy(rows, 'cost'))}</td>
              <td className={ctapClass(_.sumBy(rows, 'cost') / (_.sumBy(rows, 'tap') || 1))}>
                ${(_.sumBy(rows, 'cost') / (_.sumBy(rows, 'tap') || 1)).toFixed(2)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DetailPanel({ record, onClose, onUpdate }) {
  const [tab, setTab] = useState('overview');
  if (!record) return null;

  const tabs = ['Overview','Performance','Blue Sheet','Export'];

  return (
    <div className="detail-overlay" onClick={onClose}>
      <div className="detail-panel" onClick={e => e.stopPropagation()}>
        <div className="detail-header">
          <h2>{record.DETAIL}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="detail-tabs">
          {tabs.map(t => (
            <button key={t} className={tab === t.toLowerCase().replace(' ','') ? 'active' : ''} onClick={() => setTab(t.toLowerCase().replace(' ',''))}>
              {t}
            </button>
          ))}
        </div>
        <div className="detail-body">
          {tab === 'overview' && <OverviewTab record={record} onUpdate={onUpdate} />}
          {tab === 'performance' && <PerformanceTab record={record} />}
          {tab === 'bluesheet' && <BlueSheetTab record={record} onUpdate={onUpdate} />}
          {tab === 'export' && <ExportTab record={record} />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ record, onUpdate }) {
  return (
    <div className="field-grid">
      <div className="field-group"><div className="field-label">Project #</div><div className="field-value">{record.PROJ_NUM}</div></div>
      <div className="field-group"><div className="field-label">Identifier</div><div className="field-value">{record.IDENTIFIER}</div></div>
      <div className="field-group"><div className="field-label">Product</div><div className="field-value">{record.PRODUCT}</div></div>
      <div className="field-group"><div className="field-label">Client</div><div className="field-value">{record.CLIENT_DESC}</div></div>
      <div className="field-group"><div className="field-label">Channel</div><div className="field-value">{record.CHANNEL_IND}</div></div>
      <div className="field-group"><div className="field-label">AE</div><div className="field-value">{record.AE}</div></div>
      <div className="field-group"><div className="field-label">Mail Date</div><div className="field-value">{record.MAIL_DATE}</div></div>
      <div className="field-group"><div className="field-label">Project Type</div><div className="field-value">{record.PROJ_TYPE}</div></div>
      <div className="field-group"><div className="field-label">CFT Director</div><div className="field-value">{record.CFT_DIRECTOR}</div></div>
      <div className="field-group"><div className="field-label">Project Status</div><div className="field-value">{record.PROJ_STATUS}</div></div>
      <div className="field-group"><div className="field-label">Mutant</div><div className="field-value">{record.MUTANT}</div></div>
      <div className="field-group"><div className="field-label">Quarter</div><div className="field-value">{record.QTR}</div></div>
      <div className="field-group full">
        <div className="field-label">Approval Status</div>
        <div className="field-value" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {approvalBadge(record._approvalStatus)}
          <select value={record._approvalStatus} onChange={e => onUpdate(record.id, { _approvalStatus: e.target.value })}
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
            {APPROVAL_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className="field-group full"><div className="field-label">Campaign Detail</div><div className="field-value">{record.DETAIL}</div></div>
      <div className="field-group"><div className="field-label">Mail Qty</div><div className="field-value">{record.MAIL_QTY?.toLocaleString()}</div></div>
      <div className="field-group"><div className="field-label">Total Cost</div><div className="field-value">{fmtMoney(record.NEW_TOTAL_COST)}</div></div>
      <div className="field-group"><div className="field-label">TAP</div><div className="field-value">{record.TAP?.toLocaleString()}</div></div>
      <div className="field-group"><div className="field-label">C/TAP</div><div className={`field-value ${ctapClass(record.C_TAP)}`}>${fmtDec(record.C_TAP)}</div></div>
      <div className="field-group"><div className="field-label">PA Issued</div><div className="field-value">{record.PA_ISSUED}</div></div>
      <div className="field-group"><div className="field-label">PA Approved</div><div className="field-value">{record.PA_APPROVED}</div></div>
      <div className="field-group"><div className="field-label">Dropped</div><div className="field-value">{record.DROPPED_IND}</div></div>
      <div className="field-group"><div className="field-label">Total PO Amount</div><div className="field-value">{fmtMoney(record.TOTAL_PO_AMOUNT)}</div></div>
    </div>
  );
}

function PerformanceTab({ record }) {
  const steps = [
    { label: 'Mail Qty', value: record.MAIL_QTY?.toLocaleString() },
    { label: 'Gross Rate', value: (record.GROSS * 100).toFixed(2) + '%' },
    { label: 'Gross Apps', value: record.GROSS_APP?.toLocaleString() },
    { label: 'Net Apps', value: record.NET_APP?.toLocaleString() },
    { label: 'AAP', value: record.AAP?.toLocaleString() },
    { label: 'TAP', value: record.TAP?.toLocaleString() },
    { label: 'Cost', value: fmtMoney(record.NEW_TOTAL_COST) },
    { label: 'C/TAP', value: `$${fmtDec(record.C_TAP)}`, cls: ctapClass(record.C_TAP) },
  ];
  return (
    <div>
      <h3 style={{ fontSize: 14, marginBottom: 8, color: 'var(--text-secondary)' }}>Performance Chain</h3>
      <div className="perf-chain">
        {steps.map((s, i) => (
          <span key={s.label} style={{ display: 'contents' }}>
            <div className="perf-step">
              <div className="perf-label">{s.label}</div>
              <div className={`perf-value ${s.cls || ''}`}>{s.value}</div>
            </div>
            {i < steps.length - 1 && <span className="perf-arrow">→</span>}
          </span>
        ))}
      </div>
      <div className="field-grid" style={{ marginTop: 20 }}>
        <div className="field-group"><div className="field-label">Pend Apps</div><div className="field-value">{record.PEND_APP}</div></div>
        <div className="field-group"><div className="field-label">Issued</div><div className="field-value">{record.ISSUED}</div></div>
        <div className="field-group"><div className="field-label">Rejected</div><div className="field-value">{record.REJECTED}</div></div>
        <div className="field-group"><div className="field-label">Net Rate</div><div className="field-value">{(record.NET * 100).toFixed(4)}%</div></div>
        <div className="field-group"><div className="field-label">Pay Rate</div><div className="field-value">{(record.PAYRATE * 100).toFixed(2)}%</div></div>
        <div className="field-group"><div className="field-label">Commission</div><div className="field-value">{fmtMoney(record.COMM)}</div></div>
        <div className="field-group"><div className="field-label">Fee/Net App</div><div className="field-value">{fmtMoney(record.FEE_NET_APP)}</div></div>
        <div className="field-group"><div className="field-label">Prod CPM</div><div className="field-value">${record.PROD_CPM}</div></div>
      </div>
    </div>
  );
}

function BlueSheetTab({ record, onUpdate }) {
  const monthly = record._monthlyBudget || Array(12).fill(0);
  const annual = monthly.reduce((a, b) => a + b, 0);

  const updateMonth = (idx, val) => {
    const next = [...monthly];
    next[idx] = Number(val) || 0;
    onUpdate(record.id, { _monthlyBudget: next });
  };

  return (
    <div>
      <h3 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-secondary)' }}>Blue Sheet Budget Allocation</h3>
      <div className="field-grid" style={{ marginBottom: 16 }}>
        <div className="field-group"><div className="field-label">Version</div><div className="field-value">{record._blueSheetVersion}</div></div>
        <div className="field-group"><div className="field-label">Expense Type</div><div className="field-value">{record._expenseType}</div></div>
        <div className="field-group"><div className="field-label">GL Account</div><div className="field-value">{record._specificExpense}</div></div>
        <div className="field-group"><div className="field-label">Client</div><div className="field-value">{record._blueSheetClient}</div></div>
        <div className="field-group"><div className="field-label">Product</div><div className="field-value">{record._blueSheetProduct}</div></div>
        <div className="field-group"><div className="field-label">Annual Total</div><div className="field-value" style={{ color: 'var(--accent)', fontWeight: 600 }}>{fmtMoney(annual)}</div></div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="bluesheet-table">
          <thead>
            <tr>
              {MONTHS.map(m => <th key={m}>{m}</th>)}
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {monthly.map((v, i) => (
                <td key={i}>
                  <input type="number" value={v} onChange={e => updateMonth(i, e.target.value)} />
                </td>
              ))}
              <td style={{ fontWeight: 600, color: 'var(--accent)' }}>{fmtMoney(annual)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ExportTab({ record }) {
  const exportPipeline = () => {
    const row = {};
    PIPELINE_FIELDS.forEach(f => { row[f] = record[f] ?? ''; });
    downloadCSV([row], `pipeline_${record.PROJ_NUM}.csv`);
  };
  const exportBlueSheet = () => {
    const monthly = record._monthlyBudget || Array(12).fill(0);
    const row = {
      Version: record._blueSheetVersion,
      'Expense Type': record._expenseType,
      'Specific Expense': record._specificExpense,
      Client: record._blueSheetClient,
      Product: record._blueSheetProduct,
      Description: record.DETAIL,
      'Annual Total': monthly.reduce((a, b) => a + b, 0),
    };
    MONTHS.forEach((m, i) => { row[m] = monthly[i]; });
    downloadCSV([row], `bluesheet_${record.PROJ_NUM}.csv`);
  };
  const exportAsana = () => {
    const task = {
      name: record.DETAIL,
      assignee: record.AE,
      due_on: record.MAIL_DATE,
      section: record.PROJ_STATUS,
      custom_fields: {
        Product: record.PRODUCT,
        Client: record.CLIENT_DESC,
        TAP: record.TAP,
        C_TAP: record.C_TAP ? Number(record.C_TAP.toFixed(2)) : 0,
        Channel: record.CHANNEL_IND,
        Approval: record._approvalStatus,
      },
    };
    downloadJSON([task], `asana_${record.PROJ_NUM}.json`);
  };

  return (
    <div className="export-section">
      <div className="export-card">
        <div><h4>MOM/Pipeline Export</h4><p>All 59 fields matching AMBA_ONLY_PIPELINE_2026.xlsx</p></div>
        <button className="btn btn-primary" onClick={exportPipeline}>Export CSV</button>
      </div>
      <div className="export-card">
        <div><h4>Blue Sheet Export</h4><p>Budget allocation with monthly columns and GL accounts</p></div>
        <button className="btn btn-primary" onClick={exportBlueSheet}>Export CSV</button>
      </div>
      <div className="export-card">
        <div><h4>Asana Export</h4><p>Task format with custom fields for project management</p></div>
        <button className="btn btn-primary" onClick={exportAsana}>Export JSON</button>
      </div>
    </div>
  );
}

function CreateEditModal({ record, onSave, onClose }) {
  const isEdit = !!record;
  const empty = {
    TEAM: 'GROWTH', NEW_TEAM: 'GROWTH MKT', TEAM_DESC: 'Growth Marketing',
    CLIENT_DESC: '', PLAN_CODE: '', CLIENT: '', PROD: '', SYSTEM: 'EPIC',
    ADMIN_IND: 'N', CHANNEL_IND: 'DIRECT MAIL', TEST_IND: 'N',
    PROJ_NUM: `P-2026-${String(Date.now()).slice(-3)}`, OPUS: '', POLICY: '',
    AE: AE_NAMES[0], MAIL_DATE: '2026-01-01', IDENTIFIER: 'BUDGET', MUTANT: 'BR',
    YEAR: 2026, QTR: 'Q1', PROJ_TYPE: 'NEW', PRODUCT: PRODUCTS[0], DETAIL: '',
    GANG_ID: '', LOB: 'P&C', CARRIER: 'CARRIER_A', COMM_TYPE: 'COMMISSION',
    MAIL_MONTH: 1, MAIL_DAY: 1, LEAD_GEN: 'N', LEAD_RATE: '0.0000',
    PROJ_STATUS: 'NOT STARTED', MAIL_QTY: 0, GROSS: 0, GROSS_APP: 0,
    PEND_APP: 0, ISSUED: 0, REJECTED: 0, NET: 0, NET_APP: 0, AAP: 0, TAP: 0,
    PAYRATE: '0.0000', COMM: 0, FEE_NET_APP: 0, EXPENSE_REIMBURSEMENT: 0,
    PROD_CPM: '0.00', C_TAP: 0, CFT_DIRECTOR: CFT_DIRECTORS[0], RISK_CODE: '',
    PA_ISSUED: 'N', PA_APPROVED: 'N', DROPPED_IND: 'N', TOTAL_PO_AMOUNT: 0,
    NEW_BY_CARR_TOTAL: 0, NEW_ALL_CARR_TOTAL: 0, NEW_AMBA_TOTAL: 0, MERCER_TOTAL: 0,
    NEW_TOTAL_COST: 0,
    _approvalStatus: 'Draft', _blueSheetVersion: 'MOM Pipeline',
    _expenseType: 'Direct_Mail', _specificExpense: '65110',
    _blueSheetClient: BLUE_SHEET_CLIENTS[0],
    _blueSheetProduct: PRODUCT_MAP[PRODUCTS[0]] || PRODUCTS[0],
    _monthlyBudget: Array(12).fill(0),
  };
  const [form, setForm] = useState(record ? { ...record } : empty);

  const set = (k, v) => {
    const next = { ...form, [k]: v };
    // Auto-calc C/TAP
    if (k === 'NEW_TOTAL_COST' || k === 'TAP') {
      const cost = k === 'NEW_TOTAL_COST' ? Number(v) : Number(next.NEW_TOTAL_COST);
      const tap = k === 'TAP' ? Number(v) : Number(next.TAP);
      next.C_TAP = tap > 0 ? cost / tap : 0;
    }
    // Auto-map expense GL
    if (k === '_expenseType') {
      next._specificExpense = GL_MAP[v] || '';
    }
    // Auto-map product
    if (k === 'PRODUCT') {
      next._blueSheetProduct = PRODUCT_MAP[v] || v;
    }
    // Auto quarter from mail date
    if (k === 'MAIL_DATE' && v) {
      const m = parseInt(v.split('-')[1]);
      next.QTR = `Q${Math.ceil(m / 3)}`;
      next.MAIL_MONTH = m;
      next.MAIL_DAY = parseInt(v.split('-')[2]);
    }
    setForm(next);
  };

  const handleSave = () => {
    onSave({ ...form, id: form.id || Date.now() });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Campaign' : 'New Campaign'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-grid">
            <div className="form-group full">
              <label>Campaign Detail</label>
              <input value={form.DETAIL} onChange={e => set('DETAIL', e.target.value)} placeholder="e.g. MOAA LIFE Direct Mail Spring Campaign" />
            </div>
            <div className="form-group">
              <label>Identifier</label>
              <select value={form.IDENTIFIER} onChange={e => set('IDENTIFIER', e.target.value)}>
                {IDENTIFIERS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Product</label>
              <select value={form.PRODUCT} onChange={e => set('PRODUCT', e.target.value)}>
                {PRODUCTS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Client</label>
              <select value={form.CLIENT_DESC} onChange={e => set('CLIENT_DESC', e.target.value)}>
                <option value="">Select...</option>
                {CLIENT_NAMES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Channel</label>
              <select value={form.CHANNEL_IND} onChange={e => set('CHANNEL_IND', e.target.value)}>
                {CHANNELS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>AE</label>
              <select value={form.AE} onChange={e => set('AE', e.target.value)}>
                {AE_NAMES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>CFT Director</label>
              <select value={form.CFT_DIRECTOR} onChange={e => set('CFT_DIRECTOR', e.target.value)}>
                {CFT_DIRECTORS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Mail Date</label>
              <input type="date" value={form.MAIL_DATE} onChange={e => set('MAIL_DATE', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Mutant</label>
              <select value={form.MUTANT} onChange={e => set('MUTANT', e.target.value)}>
                {MUTANTS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Project Status</label>
              <select value={form.PROJ_STATUS} onChange={e => set('PROJ_STATUS', e.target.value)}>
                {PROJ_STATUSES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Project Type</label>
              <select value={form.PROJ_TYPE} onChange={e => set('PROJ_TYPE', e.target.value)}>
                {['NEW','RENEWAL','REISSUE'].map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Mail Qty</label>
              <input type="number" value={form.MAIL_QTY} onChange={e => set('MAIL_QTY', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Gross Apps</label>
              <input type="number" value={form.GROSS_APP} onChange={e => set('GROSS_APP', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Net Apps</label>
              <input type="number" value={form.NET_APP} onChange={e => set('NET_APP', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>AAP</label>
              <input type="number" value={form.AAP} onChange={e => set('AAP', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>TAP</label>
              <input type="number" value={form.TAP} onChange={e => set('TAP', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>Total Cost</label>
              <input type="number" value={form.NEW_TOTAL_COST} onChange={e => set('NEW_TOTAL_COST', Number(e.target.value))} />
            </div>
            <div className="form-group">
              <label>C/TAP (auto-calculated)</label>
              <input className="computed" readOnly value={form.TAP > 0 ? `$${(form.NEW_TOTAL_COST / form.TAP).toFixed(2)}` : '—'} />
            </div>
            <div className="form-group">
              <label>Expense Type</label>
              <select value={form._expenseType} onChange={e => set('_expenseType', e.target.value)}>
                {EXPENSE_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>GL Account</label>
              <input readOnly className="computed" value={form._specificExpense} />
            </div>
            <div className="form-group">
              <label>Approval Status</label>
              <select value={form._approvalStatus} onChange={e => set('_approvalStatus', e.target.value)}>
                {APPROVAL_STATUSES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Blue Sheet Client</label>
              <select value={form._blueSheetClient} onChange={e => set('_blueSheetClient', e.target.value)}>
                {BLUE_SHEET_CLIENTS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>{isEdit ? 'Save Changes' : 'Create Campaign'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Edit Modal ──────────────────────────────────────────────────────────

const BULK_EDIT_FIELDS = [
  { key: 'CFT_DIRECTOR', label: 'CFT Director', type: 'enum', options: CFT_DIRECTORS },
  { key: 'AE', label: 'AE', type: 'enum', options: AE_NAMES },
  { key: 'PROJ_STATUS', label: 'Project Status', type: 'enum', options: PROJ_STATUSES },
  { key: 'PROJ_TYPE', label: 'Project Type', type: 'enum', options: ['NEW','RENEWAL','REISSUE'] },
  { key: 'PRODUCT', label: 'Product', type: 'enum', options: PRODUCTS },
  { key: '_approvalStatus', label: 'Approval Status', type: 'enum', options: APPROVAL_STATUSES },
  { key: '_expenseType', label: 'Expense Type', type: 'enum', options: EXPENSE_TYPES },
  { key: '_blueSheetClient', label: 'Blue Sheet Client', type: 'enum', options: BLUE_SHEET_CLIENTS },
  { key: 'MAIL_DATE', label: 'Mail Date', type: 'date' },
  { key: 'MAIL_QTY', label: 'Mail Qty', type: 'number' },
  { key: 'AAP', label: 'AAP', type: 'number' },
  { key: 'TAP', label: 'TAP', type: 'number' },
  { key: 'NEW_TOTAL_COST', label: 'Total Cost', type: 'number' },
];

function computeBulkValue(original, fieldDef, value, numericMode, numericArg) {
  if (fieldDef.type === 'enum') return value;
  if (fieldDef.type === 'date') return value;
  // numeric
  const orig = Number(original) || 0;
  const arg = Number(numericArg) || 0;
  if (numericMode === 'set') return arg;
  if (numericMode === 'multiply') return Math.round(orig * arg);
  if (numericMode === 'add') return orig + arg;
  return orig;
}

function formatFieldValue(val, fieldDef) {
  if (val == null || val === '') return '—';
  if (fieldDef.type === 'number') return Number(val).toLocaleString();
  return String(val);
}

function BulkEditModal({ records, onApply, onClose }) {
  const [fieldKey, setFieldKey] = useState('');
  const [enumValue, setEnumValue] = useState('');
  const [dateValue, setDateValue] = useState('');
  const [numericMode, setNumericMode] = useState('set');
  const [numericArg, setNumericArg] = useState('');

  const fieldDef = BULK_EDIT_FIELDS.find(f => f.key === fieldKey);

  // Reset inputs when field changes
  const handleFieldChange = (key) => {
    setFieldKey(key);
    const def = BULK_EDIT_FIELDS.find(f => f.key === key);
    if (def?.type === 'enum') setEnumValue(def.options[0]);
    if (def?.type === 'date') setDateValue('');
    setNumericMode('set');
    setNumericArg('');
  };

  // Compute preview for first 3 records
  const previewRecords = records.slice(0, 3);
  const getNewValue = (record) => {
    if (!fieldDef) return null;
    if (fieldDef.type === 'enum') return enumValue;
    if (fieldDef.type === 'date') return dateValue;
    return computeBulkValue(record[fieldKey], fieldDef, null, numericMode, numericArg);
  };

  const canApply = fieldDef && (
    (fieldDef.type === 'enum' && enumValue) ||
    (fieldDef.type === 'date' && dateValue) ||
    (fieldDef.type === 'number' && numericArg !== '')
  );

  const handleApply = () => {
    if (!fieldDef || !canApply) return;
    const updates = {};
    if (fieldDef.type === 'enum') {
      updates[fieldKey] = enumValue;
      // Auto-map GL when changing expense type
      if (fieldKey === '_expenseType') updates._specificExpense = GL_MAP[enumValue] || '';
      // Auto-map blue sheet product when changing product
      if (fieldKey === 'PRODUCT') updates._blueSheetProduct = PRODUCT_MAP[enumValue] || enumValue;
    } else if (fieldDef.type === 'date') {
      updates[fieldKey] = dateValue;
      // Auto-calc quarter/month/day from MAIL_DATE
      if (fieldKey === 'MAIL_DATE' && dateValue) {
        const m = parseInt(dateValue.split('-')[1]);
        updates.QTR = `Q${Math.ceil(m / 3)}`;
        updates.MAIL_MONTH = m;
        updates.MAIL_DAY = parseInt(dateValue.split('-')[2]);
      }
    }
    // For numeric, we pass the mode so the caller can compute per-record
    onApply(fieldKey, fieldDef, updates, numericMode, numericArg);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal bulk-edit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit {records.length} selected record{records.length !== 1 ? 's' : ''}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label>Field to edit</label>
            <select value={fieldKey} onChange={e => handleFieldChange(e.target.value)}>
              <option value="">Select a field...</option>
              {BULK_EDIT_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
          </div>

          {fieldDef?.type === 'enum' && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>New value for {fieldDef.label}</label>
              <select value={enumValue} onChange={e => setEnumValue(e.target.value)}>
                {fieldDef.options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}

          {fieldDef?.type === 'date' && (
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>New value for {fieldDef.label}</label>
              <input type="date" value={dateValue} onChange={e => setDateValue(e.target.value)} />
            </div>
          )}

          {fieldDef?.type === 'number' && (
            <div className="bulk-edit-numeric" style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                How to update {fieldDef.label}
              </label>
              <div className="bulk-edit-numeric-row">
                <select value={numericMode} onChange={e => setNumericMode(e.target.value)}>
                  <option value="set">Set to value</option>
                  <option value="multiply">Multiply by</option>
                  <option value="add">Add / subtract</option>
                </select>
                <input
                  type="number"
                  value={numericArg}
                  onChange={e => setNumericArg(e.target.value)}
                  placeholder={numericMode === 'multiply' ? 'e.g. 1.5' : numericMode === 'add' ? 'e.g. -500' : 'e.g. 10000'}
                />
              </div>
            </div>
          )}

          {fieldDef && previewRecords.length > 0 && (
            <div className="bulk-edit-preview">
              <h4>Preview ({Math.min(3, records.length)} of {records.length} records)</h4>
              <table>
                <thead>
                  <tr>
                    <th>Project #</th>
                    <th>Campaign</th>
                    <th>Before</th>
                    <th></th>
                    <th>After</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRecords.map(r => {
                    const newVal = getNewValue(r);
                    return (
                      <tr key={r.id}>
                        <td>{r.PROJ_NUM}</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.DETAIL}</td>
                        <td className="preview-before">{formatFieldValue(r[fieldKey], fieldDef)}</td>
                        <td className="preview-arrow">→</td>
                        <td className="preview-after">{canApply ? formatFieldValue(newVal, fieldDef) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!canApply} onClick={handleApply}>
            Apply to {records.length} record{records.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

function ImportModal({ onImport, onClose }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'preview'
  const [parsedRows, setParsedRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  const parseFile = (file) => {
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (!json.length) {
          setError('No data rows found in the file.');
          return;
        }
        setParsedRows(json);
        setStep('preview');
      } catch (err) {
        setError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = () => setDragging(false);

  // Preview stats
  const identifierBreakdown = _.countBy(parsedRows, 'IDENTIFIER');
  const productCounts = _.countBy(parsedRows, 'PRODUCT');
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const missingRows = parsedRows.filter(r => !r.CLIENT_DESC || !r.PRODUCT || !r.IDENTIFIER);
  const previewSample = parsedRows.slice(0, 5);
  const sampleCols = ['PROJ__', 'PROJ_NUM', 'IDENTIFIER', 'PRODUCT', 'CLIENT_DESC', 'AE', 'MAIL_QTY', 'TAP', 'NEW_TOTAL_COST'];
  // Show whichever columns actually exist in the data
  const visibleCols = sampleCols.filter(c => previewSample.some(r => r[c] !== undefined && r[c] !== ''));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal import-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Campaign Data</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {step === 'upload' && (
            <div>
              <div
                className={`drop-zone ${dragging ? 'drop-zone-active' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFileSelect} style={{ display: 'none' }} />
                <div className="drop-icon">+</div>
                <div className="drop-text">Drag & drop your file here</div>
                <div className="drop-sub">or click to browse</div>
                <div className="drop-formats">.xlsx, .xls, .csv</div>
              </div>
              {error && <div className="import-error">{error}</div>}
              <div className="import-hint">
                <strong>Expected format:</strong> AMBA_ONLY_PIPELINE_2026.xlsx with 59 column headers in row 1.
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="import-preview">
              <div className="import-file-name">File: {fileName}</div>

              <div className="import-stats">
                <div className="import-stat">
                  <div className="import-stat-value">{parsedRows.length}</div>
                  <div className="import-stat-label">Total Records</div>
                </div>
                {Object.entries(identifierBreakdown).map(([key, count]) => (
                  <div className="import-stat" key={key}>
                    <div className="import-stat-value">{count}</div>
                    <div className="import-stat-label">{key || 'NO IDENTIFIER'}</div>
                  </div>
                ))}
              </div>

              <div className="import-section">
                <h4>Top Products</h4>
                <div className="import-tags">
                  {topProducts.map(([prod, count]) => (
                    <span className="import-tag" key={prod}>{prod || 'UNKNOWN'}: {count}</span>
                  ))}
                </div>
              </div>

              {missingRows.length > 0 && (
                <div className="import-section import-warnings">
                  <h4>Warnings</h4>
                  <p>{missingRows.length} row{missingRows.length > 1 ? 's' : ''} missing required fields (CLIENT_DESC, PRODUCT, or IDENTIFIER). These will be imported with empty values.</p>
                </div>
              )}

              <div className="import-section">
                <h4>Sample Data (first 5 rows)</h4>
                <div className="data-grid-wrap" style={{ maxHeight: 220 }}>
                  <table className="data-grid">
                    <thead>
                      <tr>
                        {visibleCols.map(c => <th key={c}>{c}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {previewSample.map((row, i) => (
                        <tr key={i}>
                          {visibleCols.map(c => (
                            <td key={c}>{row[c] ?? '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          {step === 'preview' && (
            <>
              <button className="btn" onClick={() => { setStep('upload'); setParsedRows([]); setFileName(''); }}>Back</button>
              <div style={{ flex: 1 }} />
              <button className="btn" onClick={onClose}>Cancel</button>
              <button className="btn btn-danger" onClick={() => onImport(parsedRows, 'replace')}>Replace All Data</button>
              <button className="btn btn-primary" onClick={() => onImport(parsedRows, 'append')}>Append to Existing</button>
            </>
          )}
          {step === 'upload' && (
            <button className="btn" onClick={onClose}>Cancel</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast">
      <span>{message}</span>
      <button className="toast-close" onClick={onClose}>×</button>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

function App() {
  const [data, setData] = useState(() => generateSeed(30));
  const [filters, setFilters] = useState({ identifier: 'BUDGET', product: '', channel: '', client: '', approval: '', director: '', search: '' });
  const [sort, setSort] = useState({ field: 'PROJ_NUM', dir: 'asc' });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [detailRecord, setDetailRecord] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'summary'
  const [visibleCols, setVisibleCols] = useState(() => new Set(DEFAULT_VISIBLE_COLS));
  const [showImport, setShowImport] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [toast, setToast] = useState(null);

  const filtered = useMemo(() => {
    let rows = [...data];
    if (filters.identifier) rows = rows.filter(r => r.IDENTIFIER === filters.identifier);
    if (filters.product) rows = rows.filter(r => r.PRODUCT === filters.product);
    if (filters.channel) rows = rows.filter(r => r.PROJ_TYPE === filters.channel);
    if (filters.client) rows = rows.filter(r => r.CLIENT_DESC === filters.client);
    if (filters.approval) rows = rows.filter(r => r._approvalStatus === filters.approval);
    if (filters.director) rows = rows.filter(r => r.CFT_DIRECTOR === filters.director);
    if (filters.search) {
      const s = filters.search.toLowerCase();
      rows = rows.filter(r => {
        const str = (f) => String(f ?? '').toLowerCase();
        return str(r.DETAIL).includes(s) ||
          str(r.PROJ_NUM).includes(s) ||
          str(r.AE).includes(s) ||
          str(r.CLIENT_DESC).includes(s) ||
          str(r.PRODUCT).includes(s);
      });
    }
    return _.orderBy(rows, [sort.field], [sort.dir]);
  }, [data, filters, sort]);

  const updateRecord = useCallback((id, updates) => {
    setData(prev => prev.map(r => {
      if (r.id !== id) return r;
      const next = { ...r, ...updates };
      if ('NEW_TOTAL_COST' in updates || 'TAP' in updates) {
        next.C_TAP = next.TAP > 0 ? next.NEW_TOTAL_COST / next.TAP : 0;
      }
      return next;
    }));
    // Also update detail panel if open
    setDetailRecord(prev => {
      if (!prev || prev.id !== id) return prev;
      const next = { ...prev, ...updates };
      if ('NEW_TOTAL_COST' in updates || 'TAP' in updates) {
        next.C_TAP = next.TAP > 0 ? next.NEW_TOTAL_COST / next.TAP : 0;
      }
      return next;
    });
  }, []);

  const handleCellEdit = useCallback((rowId, colKey, newValue) => {
    setData(prev => prev.map(r => {
      if (r.id !== rowId) return r;
      const next = { ...r, [colKey]: newValue };
      // Auto-recalculate C_TAP when cost or TAP changes
      if (colKey === 'NEW_TOTAL_COST' || colKey === 'TAP') {
        next.C_TAP = next.TAP > 0 ? next.NEW_TOTAL_COST / next.TAP : 0;
      }
      // Auto-map GL when expense type changes
      if (colKey === '_expenseType') {
        next._specificExpense = GL_MAP[newValue] || '';
      }
      // Auto-map blue sheet product
      if (colKey === 'PRODUCT') {
        next._blueSheetProduct = PRODUCT_MAP[newValue] || newValue;
      }
      // Auto-update QTR/month/day from MAIL_DATE
      if (colKey === 'MAIL_DATE' && newValue) {
        const parts = String(newValue).split('-');
        if (parts.length >= 2) {
          const m = parseInt(parts[1]);
          next.QTR = `Q${Math.ceil(m / 3)}`;
          next.MAIL_MONTH = m;
          next.MAIL_DAY = parseInt(parts[2]) || 1;
        }
      }
      return next;
    }));
    // Also update detail panel if it's showing this record
    setDetailRecord(prev => {
      if (!prev || prev.id !== rowId) return prev;
      const next = { ...prev, [colKey]: newValue };
      if (colKey === 'NEW_TOTAL_COST' || colKey === 'TAP') {
        next.C_TAP = next.TAP > 0 ? next.NEW_TOTAL_COST / next.TAP : 0;
      }
      return next;
    });
  }, []);

  const handleSave = (record) => {
    if (data.find(r => r.id === record.id)) {
      setData(prev => prev.map(r => r.id === record.id ? record : r));
    } else {
      setData(prev => [...prev, record]);
    }
    setShowModal(false);
    setEditRecord(null);
  };

  // Compute how many selected records actually exist in data
  const selectedCount = useMemo(() => {
    let count = 0;
    const ids = new Set(data.map(r => r.id));
    for (const id of selectedIds) { if (ids.has(id)) count++; }
    return count;
  }, [data, selectedIds]);

  const selectedRecords = useMemo(() =>
    data.filter(r => selectedIds.has(r.id)),
  [data, selectedIds]);

  const bulkSetApproval = (status) => {
    const count = selectedCount;
    setData(prev => prev.map(r => selectedIds.has(r.id) ? { ...r, _approvalStatus: status } : r));
    setToast(`Updated ${count} records to ${status}`);
  };

  const bulkExportPipeline = () => {
    const rows = selectedRecords.map(r => {
      const row = {};
      PIPELINE_FIELDS.forEach(f => { row[f] = r[f] ?? ''; });
      return row;
    });
    downloadCSV(rows, 'AMBA_ONLY_PIPELINE_2026_selected.csv');
    setToast(`Exported ${rows.length} records as MOM Pipeline`);
  };

  const bulkExportBlueSheet = () => {
    const rows = selectedRecords.map(r => {
      const monthly = r._monthlyBudget || Array(12).fill(0);
      const row = {
        Version: r._blueSheetVersion,
        'Expense Type': r._expenseType,
        'Specific Expense': r._specificExpense,
        Client: r._blueSheetClient,
        Product: r._blueSheetProduct,
        Description: r.DETAIL,
        'Annual Total': monthly.reduce((a, b) => a + b, 0),
      };
      MONTHS.forEach((m, i) => { row[m] = monthly[i]; });
      return row;
    });
    downloadCSV(rows, 'BlueSheet_2026_selected.csv');
    setToast(`Exported ${rows.length} records as Blue Sheet`);
  };

  const bulkExportAsana = () => {
    const tasks = selectedRecords.map(r => ({
      name: r.DETAIL,
      assignee: r.AE,
      due_on: r.MAIL_DATE,
      section: r.PROJ_STATUS,
      custom_fields: {
        Product: r.PRODUCT,
        Client: r.CLIENT_DESC,
        TAP: r.TAP,
        C_TAP: r.C_TAP ? Number(r.C_TAP.toFixed(2)) : 0,
        Channel: r.CHANNEL_IND,
        Approval: r._approvalStatus,
      },
    }));
    downloadJSON(tasks, 'Asana_Tasks_2026_selected.json');
    setToast(`Exported ${tasks.length} records as Asana tasks`);
  };

  const handleBulkEdit = (fieldKey, fieldDef, enumOrDateUpdates, numericMode, numericArg) => {
    const count = selectedCount;
    const label = fieldDef.label;
    let displayValue = '';

    setData(prev => prev.map(r => {
      if (!selectedIds.has(r.id)) return r;
      const next = { ...r };

      if (fieldDef.type === 'number') {
        next[fieldKey] = computeBulkValue(r[fieldKey], fieldDef, null, numericMode, numericArg);
        displayValue = numericMode === 'set' ? numericArg : `${numericMode} ${numericArg}`;
      } else {
        Object.assign(next, enumOrDateUpdates);
        displayValue = enumOrDateUpdates[fieldKey];
      }

      // Recalculate C_TAP if cost or TAP changed
      if (fieldKey === 'NEW_TOTAL_COST' || fieldKey === 'TAP') {
        next.C_TAP = next.TAP > 0 ? next.NEW_TOTAL_COST / next.TAP : 0;
      }
      return next;
    }));

    if (fieldDef.type === 'number' && numericMode !== 'set') {
      setToast(`Updated ${label} (${numericMode} ${numericArg}) on ${count} records`);
    } else {
      setToast(`Updated ${label} to ${displayValue} on ${count} records`);
    }
    setShowBulkEdit(false);
    setSelectedIds(new Set());
  };

  const exportAllPipeline = () => {
    const rows = filtered.map(r => {
      const row = {};
      PIPELINE_FIELDS.forEach(f => { row[f] = r[f] ?? ''; });
      return row;
    });
    downloadCSV(rows, 'AMBA_ONLY_PIPELINE_2026.csv');
  };

  const exportAllBlueSheet = () => {
    const rows = filtered.map(r => {
      const monthly = r._monthlyBudget || Array(12).fill(0);
      const row = {
        Version: r._blueSheetVersion,
        'Expense Type': r._expenseType,
        'Specific Expense': r._specificExpense,
        Client: r._blueSheetClient,
        Product: r._blueSheetProduct,
        Description: r.DETAIL,
        'Annual Total': monthly.reduce((a, b) => a + b, 0),
      };
      MONTHS.forEach((m, i) => { row[m] = monthly[i]; });
      return row;
    });
    downloadCSV(rows, 'BlueSheet_2026.csv');
  };

  const exportAllAsana = () => {
    const tasks = filtered.map(r => ({
      name: r.DETAIL,
      assignee: r.AE,
      due_on: r.MAIL_DATE,
      section: r.PROJ_STATUS,
      custom_fields: {
        Product: r.PRODUCT,
        Client: r.CLIENT_DESC,
        TAP: r.TAP,
        C_TAP: r.C_TAP ? Number(r.C_TAP.toFixed(2)) : 0,
        Channel: r.CHANNEL_IND,
        Approval: r._approvalStatus,
      },
    }));
    downloadJSON(tasks, 'Asana_Tasks_2026.json');
  };

  const handleImport = (rawRows, mode) => {
    const startId = mode === 'replace' ? 1 : (Math.max(0, ...data.map(r => r.id)) + 1);
    const processed = processImportedRows(rawRows, startId);
    if (mode === 'replace') {
      setData(processed);
    } else {
      setData(prev => [...prev, ...processed]);
    }
    setShowImport(false);
    setToast(`Successfully imported ${processed.length} campaign records`);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1><span>CMS</span> Campaign Management System</h1>
        <div className="header-actions">
          <button className="btn" onClick={exportAllPipeline}>Export Pipeline</button>
          <button className="btn" onClick={exportAllBlueSheet}>Export Blue Sheet</button>
          <button className="btn" onClick={exportAllAsana}>Export Asana</button>
          <button className="btn" onClick={() => setShowImport(true)}>Import</button>
          <button className="btn btn-primary" onClick={() => { setEditRecord(null); setShowModal(true); }}>+ New Campaign</button>
        </div>
      </header>

      <div className="app-body">
        <SummaryCards data={filtered} />
        <FilterBar filters={filters} setFilters={setFilters} data={data} />

        {selectedCount > 0 && (
          <div className="bulk-bar">
            <span className="bulk-count">{selectedCount} record{selectedCount !== 1 ? 's' : ''} selected</span>
            <div className="bulk-divider" />
            <span className="bulk-label">Set Status:</span>
            {APPROVAL_STATUSES.map(s => (
              <button key={s} className="btn btn-sm" onClick={() => bulkSetApproval(s)}>{s}</button>
            ))}
            <div className="bulk-divider" />
            <button className="btn btn-sm btn-bulk-edit" onClick={() => setShowBulkEdit(true)}>Set Field Across Selected</button>
            <div className="bulk-divider" />
            <span className="bulk-label">Export:</span>
            <button className="btn btn-sm" onClick={bulkExportPipeline}>MOM</button>
            <button className="btn btn-sm" onClick={bulkExportBlueSheet}>Blue Sheet</button>
            <button className="btn btn-sm" onClick={bulkExportAsana}>Asana</button>
            <div className="bulk-spacer" />
            <button className="bulk-deselect" onClick={() => setSelectedIds(new Set())}>Deselect all</button>
          </div>
        )}

        <div className="grid-toolbar">
          <div className="left">
            <span className="record-count">{filtered.length} campaigns</span>
          </div>
          <div className="right">
            <ColumnPicker visibleCols={visibleCols} setVisibleCols={setVisibleCols} />
            <button className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : ''}`} onClick={() => setViewMode('grid')}>Detail View</button>
            <button className={`btn btn-sm ${viewMode === 'summary' ? 'btn-primary' : ''}`} onClick={() => setViewMode('summary')}>Summary View</button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <DataGrid
            data={filtered}
            sort={sort}
            setSort={setSort}
            selectedIds={selectedIds}
            setSelectedIds={setSelectedIds}
            onRowClick={(row) => setDetailRecord(row)}
            visibleCols={visibleCols}
            onCellEdit={handleCellEdit}
          />
        ) : (
          <SummaryView data={filtered} />
        )}
      </div>

      {detailRecord && (
        <DetailPanel
          record={detailRecord}
          onClose={() => setDetailRecord(null)}
          onUpdate={updateRecord}
        />
      )}

      {showModal && (
        <CreateEditModal
          record={editRecord}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditRecord(null); }}
        />
      )}

      {showImport && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {showBulkEdit && selectedCount > 0 && (
        <BulkEditModal
          records={selectedRecords}
          onApply={handleBulkEdit}
          onClose={() => setShowBulkEdit(false)}
        />
      )}

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

export default App;
