# Invoice Generator — Complete Technical Specification

## 1. Architecture Overview

### File Structure

```
C:\Projects\invoice-generator\
├── .env                          # DATABASE_URL, JWT_SECRET, PORT
├── .env.example                  # Example env file
├── .gitignore
├── .dockerignore
├── AGENTS.md                     # Project rules for AI agents
├── Dockerfile                    # Node 20 Alpine, exposes port 3000
├── docker-compose.yml
├── package.json                  # express, pg, bcryptjs, jsonwebtoken, dotenv
├── opencode.json
├── index.html                    # SPA entry point
├── css/
│   └── styles.css                # All styles (2322 lines)
├── js/
│   ├── utils.js                  # Utility functions
│   ├── api.js                    # API client (fetch-based, talks to Express backend)
│   ├── templates.js              # Template definitions, accent colors, default settings
│   ├── pdf.js                    # jsPDF + html2canvas PDF generation (17 template renderers)
│   ├── app.js                    # Router, init, hash-change listener
│   └── components/
│       ├── nav.js                # Navigation rendering, theme toggle
│       ├── auth.js               # Login/register forms
│       ├── dashboard.js          # Dashboard page
│       ├── form.js               # Invoice creation/editing form, live preview
│       ├── history.js            # Invoice history table, search, CRUD
│       └── settings.js           # Settings page, template grid, color picker
└── server/
    ├── index.js                  # Express server entry, static serving, route mounting
    ├── db.js                     # PostgreSQL connection, schema init (3 tables)
    ├── middleware/
    │   └── auth.js               # JWT auth middleware
    └── routes/
        ├── auth.js               # POST /register, POST /login
        ├── invoices.js           # CRUD routes for invoices
        └── settings.js          # CRUD routes for settings, next-invoice-number, bulk
```

### Architecture Pattern

- **No build step**: Vanilla JS, no bundler, no modules — all global functions loaded via `<script>` tags
- **SPA routing**: Hash-based (`#/`, `#/create`, `#/history`, `#/settings`, `#/edit/:id`, `#/login`, `#/register`)
- **Backend**: Express + PostgreSQL via `pg` driver; JWT auth for all protected routes
- **PDF generation**: Two methods — client-side jsPDF (17 manual template renderers) and html2canvas (pixel-perfect capture of live HTML preview)
- **Global function pattern**: Every function is attached to `window` implicitly via script loading order

### Script Load Order (critical — each depends on prior)

1. `js/utils.js`
2. `js/api.js`
3. `js/templates.js`
4. `js/pdf.js`
5. `js/components/nav.js`
6. `js/components/auth.js`
7. `js/components/dashboard.js`
8. `js/components/form.js`
9. `js/components/history.js`
10. `js/components/settings.js`
11. `js/app.js` (last — triggers routing init)

### External CDN Dependencies

- **Google Fonts**: `Inter` (weights 300, 400, 500, 600, 700)
- **jsPDF** v2.5.1: `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`
- **html2canvas** v1.4.1: `https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js`

---

## 2. Utilities (`js/utils.js`)

| Function | Signature | Description |
|---|---|---|
| `escapeHTML` | `(str)` | Creates a div element, sets textContent to `String(str)`, returns innerHTML. Returns `''` if nullish. |
| `formatCurrency` | `(amount, currency)` | Formats amount with Intl.NumberFormat. `USD` uses `en-US`, `EUR` uses `de-DE`, default `CAD` uses `en-CA`. |
| `getCurrencySymbol` | `(currency)` | Returns `€` for EUR, `$` for USD, `$` (fallback) for others. |
| `formatDate` | `(dateStr)` | Parses `dateStr + 'T00:00:00'`, returns `toLocaleDateString` with year/month/day options. Returns `''` if falsy. |
| `formatLineItemDate` | `(dateStr, format)` | Converts date string to formatted string based on format: `'YYYY/MM/DD'`, `'YYYY-MM-DD'`, `'DD-MM-YYYY'`, `'DD/MM/YYYY'`, `'DD-MM'`, `'DD/MM'`, or default (calls `formatDate`). |
| `showLoading` | `()` | Sets `#app` innerHTML to a loading spinner div. |
| `INVOICE_STATUSES` | constant | `['draft', 'sent', 'paid', 'overdue']` |
| `getStatusBadge` | `(status)` | Returns `<span>` with colored background/text. Draft=gray, sent=accent, paid=green, overdue=red. |
| `debounce` | `(fn, ms)` | Returns debounced version of fn that fires after ms delay. |
| `getClientList` | `async ()` | Fetches all invoices, extracts unique `clientName` values, returns array. |
| `parseCSV` | `(text)` | Parses CSV/TSV text. Auto-detects `;` and `\t` delimiters. Handles quoted fields. Returns `{ headers: string[], rows: object[] }`. |
| `CSV_FIELD_OPTIONS` | constant | Array of `{ value, label }` for CSV column mapping: `description`, `rate`, `hours`, `_skip`. |
| `guessCSVMapping` | `(headers)` | Auto-maps CSV column headers to field names by matching keywords. |

---

## 3. API Client (`js/api.js`)

All API functions use `API_BASE = ''` (same origin). Auth token stored in `localStorage` key `'token'`.

| Function | Method | Endpoint | Description |
|---|---|---|---|
| `getToken` | — | — | Returns `localStorage.getItem('token')` |
| `apiFetch` | dynamic | `${API_BASE}${url}` | Generic fetch wrapper. Adds `Authorization: Bearer <token>`. On 401: clears token, redirects to `#/login`. On 204: returns null. |
| `register` | POST | `/api/auth/register` | Registers user, stores token in localStorage, returns data. |
| `login` | POST | `/api/auth/login` | Logs in user, stores token, returns data. |
| `logout` | — | — | Clears localStorage token, redirects to `#/login`. |
| `isLoggedIn` | — | — | Returns `true` if token exists in localStorage. |
| `getAllInvoices` | GET | `/api/invoices` | Returns array of all user invoices. |
| `getInvoice` | GET | `/api/invoices/:id` | Returns single invoice by id. |
| `saveInvoice` | POST | `/api/invoices` | Creates or updates invoice (server does upsert). |
| `deleteInvoice` | DELETE | `/api/invoices/:id` | Deletes invoice by id. |
| `getAllSettings` | GET | `/api/settings` | Returns all user settings as key-value object. |
| `getSetting` | GET | `/api/settings/:key` | Returns single setting value. |
| `saveSetting` | PUT | `/api/settings/:key` | Upserts single setting `{ value }`. |
| `saveSettingsBulk` | PUT | `/api/settings/bulk` | Upserts all settings in a single transaction. |
| `clearSettings` | DELETE | `/api/settings` | Deletes all user settings. |
| `getNextInvoiceNumber` | GET | `/api/settings/next-invoice-number` | Returns `{ prefix, year, num }` for auto-numbering. |
| `updateInvoiceNumberCounter` | POST | `/api/settings/update-invoice-counter` | Updates the invoice number counter. |
| `formatInvoiceNumber` | GET | `/api/settings/invoicePattern` | Fetches prefix, returns `${prefix}-${year}-${paddedNum}`. Default prefix `'INV'`. |

---

## 4. Templates & Settings (`js/templates.js`)

### TEMPLATES Array (17 entries)

| id | name | style |
|---|---|---|
| `classic` | Classic | serif-header |
| `modern` | Modern | sans-bold |
| `clean` | Clean | minimal |
| `bold` | Bold | heavy-accent |
| `elegant` | Elegant | thin-lines |
| `compact` | Compact | dense |
| `sidebar` | Sidebar | left-accent |
| `bordered` | Bordered | full-border |
| `subtle` | Subtle | light-accent |
| `stripe` | Stripe | header-stripe |
| `grid` | Grid | grid-lines |
| `corner` | Corner | corner-accent |
| `executive` | Executive | top-line |
| `minimal` | Minimal | accent-block |
| `divider` | Divider | accent-rules |
| `dash` | Dash | accent-dash |
| `swiss` | Swiss | swiss-style |

### ACCENT_COLORS Array (15 entries)

Blue `#2563eb`, Teal `#0d9488`, Green `#16a34a`, Emerald `#059669`, Purple `#7c3aed`, Indigo `#4f46e5`, Red `#dc2626`, Orange `#ea580c`, Amber `#d97706`, Pink `#db2777`, Rose `#e11d48`, Slate `#475569`, Navy `#1e3a5f`, Forest `#2d5016`, Crimson `#991b1b`

### `getDefaultSettings()` Return Object

| Key | Default | Type |
|---|---|---|
| `companyName` | `''` | string |
| `companyAddress` | `''` | string |
| `companyEmail` | `''` | string |
| `companyPhone` | `''` | string |
| `companyWebsite` | `''` | string |
| `logo` | `null` | null/string |
| `template` | `'modern'` | string |
| `accentColor` | `'#2563eb'` | string |
| `invoicePrefix` | `'INV'` | string |
| `currency` | `'CAD'` | string |
| `taxTPS` | `true` | boolean |
| `taxTVQ` | `true` | boolean |
| `tpsRate` | `0.05` | number |
| `tvqRate` | `0.09975` | number |
| `notes` | `''` | string |
| `paymentTerms` | `'Net 30'` | string |
| `labelInvoice` | `'INVOICE'` | string |
| `labelBillTo` | `'Bill To:'` | string |
| `labelSubtotal` | `'Subtotal'` | string |
| `labelTotal` | `'Total'` | string |
| `labelNotes` | `'Notes'` | string |
| `labelPaymentTerms` | `'Payment Terms'` | string |
| `labelDescription` | `'Description'` | string |
| `labelRate` | `'Rate'` | string |
| `labelHours` | `'Hours'` | string |
| `labelAmount` | `'Amount'` | string |
| `labelInvoiceNumber` | `'Invoice #'` | string |
| `labelDate` | `'Date'` | string |
| `labelDueDate` | `'Due'` | string |
| `labelTPS` | `'TPS'` | string |
| `labelTVQ` | `'TVQ'` | string |
| `dateFormat` | `'default'` | string |
| `datePosition` | `'rotated'` | string |
| `colDescription` | `35` | number |
| `colRate` | `15` | number |
| `colHours` | `15` | number |
| `colAmount` | `20` | number |

---

## 5. PDF Generation (`js/pdf.js`)

### Helper Functions

| Function | Signature | Description |
|---|---|---|
| `calculateTotals` | `(lineItems, settings)` | Returns `{ subtotal, tps, tvq, total }`. Subtotal = sum(rate × hours). TPS on `subtotal` if `settings.taxTPS`. TVQ on `subtotal` if `settings.taxTVQ` — both taxes apply to the base subtotal only, never compounding. |
| `hexToRgb` | `(hex)` | Parses `#RRGGBB` → `{ r, g, b }`. Falls back to `{ r:0, g:0, b:0 }`. |
| `addLogo` | `(doc, logo, x, y, width, height)` | Adds base64 logo image (PNG/JPEG) to PDF. Returns `true` on success, `false` on failure. |
| `checkPageBreak` | `(doc, y, neededSpace=20)` | If `y + neededSpace > pageHeight - 20`, adds new page and returns `30`. Otherwise returns `y`. |

### `renderTemplate(doc, invoice, settings)`

Central dispatch. Calls `calculateTotals` and `hexToRgb`, then `switch` on `settings.template`:

| case | calls |
|---|---|
| `classic` | `renderClassic(...)` |
| `modern` | `renderModern(...)` (has pageHeight param) |
| `clean` | `renderClean(...)` |
| `bold` | `renderBold(...)` |
| `elegant` | `renderElegant(...)` |
| `compact` | `renderCompact(...)` |
| `sidebar` | `renderSidebar(...)` (has pageHeight) |
| `bordered` | `renderBordered(...)` |
| `subtle` | `renderSubtle(...)` |
| `stripe` | `renderStripe(...)` |
| `grid` | `renderGrid(...)` |
| `corner` | `renderCorner(...)` |
| `executive` | `renderExecutive(...)` |
| `minimal` | `renderMinimal(...)` |
| `divider` | `renderDivider(...)` |
| `dash` | `renderDash(...)` |
| `swiss` | `renderSwiss(...)` |
| default | `renderModern(...)` (has pageHeight) |

All renderers receive: `(doc, invoice, settings, accent, margin, contentWidth, pageWidth, [pageHeight], subtotal, tps, tvq, total)`. Only `modern` and `sidebar` include the `pageHeight` param.

### Shared Rendering Functions

| Function | Signature | Description |
|---|---|---|
| `renderHeader` | `(doc, invoice, settings, accent, margin, contentWidth, pageWidth, y)` | Draws company logo (if any) + company name in accent color, company address/email/phone/website below, "INVOICE" label top-right, invoice number/date/due date meta. Returns new `y`. |
| `renderClientSection` | `(doc, invoice, settings, accent, margin, contentWidth, y)` | Draws "Bill To:" label in accent color, client name (bold), client address, client email. Returns new `y`. |
| `renderLineItems` | `(doc, invoice, settings, accent, margin, contentWidth, y)` | Draws line items table. **Header rendering flags**: `isGrid` → accent bar + column dividers; `isClassic` → black doubled border + serif font; `isClean` → light gray underline + gray text; `isMinimalHeader` (executive/minimal/divider/dash/swiss) → light gray underline + gray text; else → accent-filled rounded header with white bold text. Supports rotated date in left margin (`datePosition === 'rotated'`, skipped for sidebar) and inline date above description. Alternating row backgrounds (skipped for grid/classic). Returns new `y`. |
| `renderTotals` | `(doc, settings, accent, margin, contentWidth, y, subtotal, tps, tvq, total)` | Draws subtotal, TPS (if enabled), TVQ (if enabled), and total. Accent-colored divider before total. Returns new `y`. |
| `renderFooter` | `(doc, settings, accent, margin, contentWidth, y, pageHeight, pageWidth)` | Draws notes section (if paymentTerms or notes), separator line, and "Generated by Invoice Generator" centered at bottom. |

### All 17 Template-Specific Renderers

Each adds unique visual embellishments before calling shared helpers (`renderHeader`, `renderClientSection`, `renderLineItems`, `renderTotals`, `renderFooter`). Two exceptions:

- **Sidebar**: Does NOT use `renderHeader`; renders company info in a 45mm accent sidebar + invoice meta in content area (offset by `sideMargin=55`)
- **Compact**: Skips `renderClientSection`; uses a compact one-line info row instead

| Renderer | Visual Decoration |
|---|---|
| `renderClassic` | Double accent lines (0.8mm + 0.3mm) at top |
| `renderModern` | Rounded accent bar across full page width at top |
| `renderClean` | Small accent dot (ellipse 1.2mm) centered at top |
| `renderBold` | Large accent rounded rect (28mm tall) with white company name + invoice number |
| `renderElegant` | Two accent lines (short left, long right) with diamond (triangle pair) |
| `renderCompact` | Accent border line + accent pill with "INVOICE" text at top-right |
| `renderSidebar` | Full-height accent sidebar (45mm) with centered white company info. Content at `sideMargin=55` |
| `renderBordered` | Accent rounded rect border around full page + 4 accent corner dots |
| `renderSubtle` | Short accent line (35mm) + thin faded line (50mm) |
| `renderStripe` | Two accent bars (3mm + 0.8mm) across full page width |
| `renderGrid` | Accent header bar (12mm, rounded) with white company name + invoice number |
| `renderCorner` | Accent triangle (45mm) + lighter secondary triangle (30mm) in top-right corner |
| `renderExecutive` | Thin accent bar (1.5mm) across full page width |
| `renderMinimal` | Small accent block (8mm × 1.5mm) at top |
| `renderDivider` | Bold accent line across full width + thin partial line (40% width) in accent-lightened color |
| `renderDash` | Accent vertical bar (1.5mm × 8mm) at left margin |
| `renderSwiss` | Accent square (3mm × 3mm) + accent-colored horizontal line with 60% blend |

### PDF Generation Entry Points

| Function | Signature | Description |
|---|---|---|
| `generatePDF` | `async (invoice, settings)` | Creates jsPDF instance (portrait, letter), calls `renderTemplate`, saves as `${invoice.number}.pdf`. Throws if jsPDF not loaded. |
| `generatePDFFromHTML` | `async (elementId, filename)` | Clones the DOM element by ID, sets to 794px width × 40px padding, renders via html2canvas at 2× scale, creates multi-page PDF. Removes clone on completion. Throws if html2canvas/jsPDF not loaded. |

---

## 6. Navigation (`js/components/nav.js`)

| Function | Description |
|---|---|
| `renderNav()` | Highlights active nav link based on `window.location.hash`. Highlights "History" for `#/edit/*` routes. Updates auth container: shows "Log Out" button if logged in, empty if not. |
| `initTheme()` | Called on DOMContentLoaded. Reads `localStorage.getItem('theme')`, sets `data-theme="dark"` on `<html>` if saved theme is `'dark'`. |
| `toggleTheme()` | Toggles `data-theme` between `'dark'` and `'light'`. Saves to localStorage. Calls `updateThemeToggle()`. |
| `updateThemeToggle()` | Updates `#theme-toggle` button innerHTML: sun icon when dark, moon icon when light. |

---

## 7. Authentication (`js/components/auth.js`)

| Function | Description |
|---|---|
| `renderAuth()` | Renders login/register page with tabs. Shows login form by default. On success: stores token, navigates to `#/`. On error: shows error text. If hash is `#/register`, auto-switches to register tab. Calls `renderNav()`. |
| `showAuthTab(tab)` | Switches between `'login'` and `'register'` tabs. Toggles display of forms, updates tab underline and color styling. |

---

## 8. Dashboard (`js/components/dashboard.js`)

| Function | Description |
|---|---|
| `renderDashboard()` | Displays: 4 stat cards (Total Invoices, Total Revenue, Paid count, Overdue count), Quick Actions (Create New, View History, Settings), Recent Invoices table (last 5). Merges settings with defaults for currency. Overdue = not paid AND dueDate < now. Calls `renderNav()`. |

---

## 9. Invoice Form (`js/components/form.js`)

### Key Functions

| Function | Signature | Description |
|---|---|---|
| `renderInvoiceForm` | `async (editId=null)` | Main form renderer. Loads settings + invoice (if editing). Builds complete form HTML. Right side: live preview. Bottom: Save & Generate PDF, Save Draft, Visual PDF, Cancel buttons. Mobile: floating preview button + overlay. |
| `renderLineItemRow` | `(item, index, settings, currencySymbol, totalItems)` | Returns `<tr>` pair (inputs row + description row) for a line item. |
| `renderTotalsHTML` | `(lineItems, settings)` | Returns HTML for subtotal, TPS, TVQ, and total rows. |
| `addLineItem` | `()` | Appends empty line item with default date. |
| `removeLineItem` | `(btn)` | Removes line item pair. Won't remove if only 1 remains. |
| `moveLineItem` | `(btn, direction)` | Moves line item up (-1) or down (+1). |
| `updateReorderButtonsState` | `()` | Disables up on first, down on last. |
| `openCSVImport` | `()` | Triggers hidden file input. |
| `handleCSVFileSelect` | `(event)` | Reads CSV file, parses, auto-maps columns, calls `showCSVImportModal()`. |
| `showCSVImportModal` | `()` | Renders modal with column mapping dropdowns + preview table. |
| `applyCSVImport` | `()` | Reads mapping, converts CSV rows to line items, merges with existing. |
| `attachFormListeners` | `()` | Attaches input/change listeners for live preview (debounced). Template/color click listeners. Custom color picker input. |
| `updatePreview` | `()` | Reads form values, merges with cached settings, renders live preview. |
| `handleFormSubmit` | `async (isDraft)` | Collects all form data, constructs invoice object, calls `saveInvoice()`. On new: increments invoice number counter. If not draft: calls `generatePDF()`. |
| `saveDraft` | `()` | Calls `handleFormSubmit(true)`. |
| `saveAndDownloadVisualPDF` | `async ()` | Finds `.preview-invoice`, temporarily sets its ID to `visual-pdf-capture`, calls `generatePDFFromHTML()`, restores ID. |
| `showToast` | `(message, type='success')` | Fixed-position toast with progress bar. Auto-removes after 3s. |
| `toggleMobilePreview` | `()` | Shows mobile preview overlay. |
| `closeMobilePreview` | `(e)` | Hides mobile preview overlay. |
| `showConfirmModal` | `(message, onConfirm)` | Renders modal with message, Cancel, and Delete buttons. |
| `setupClientAutocomplete` | `async ()` | Fetches client list, creates/updates `<datalist>` with client names. |
| `setupFormKeyboardShortcuts` | `()` | Ctrl+S for saveDraft, Ctrl+Enter for handleFormSubmit(false). |
| `renderLivePreview` | `(settings, invoice)` | Generates complete HTML for the invoice preview. Creates `.preview-invoice` div with template class `preview-template-{id}` and CSS custom properties `--accent`, `--accent-light`, `--accent-med`. Calls `getTemplatePreviewStyle()` for header decoration. |
| `getTemplatePreviewStyle` | `(template, accent, companyName, invoice, settings)` | Switch on template ID, returns HTML string for decorative header. Default falls back to modern accent bar. |

### Line Item Fields

| Column | Input Type |
|---|---|
| Date | `<input type="date">` |
| Rate | `<input type="number" step="0.01" min="0">` with currency prefix |
| Hours | `<input type="number" step="0.5" min="0">` |
| Amount | Computed cell (rate × hours) |
| Actions | Reorder up/down + remove button |
| Description | `<textarea rows="1">` spanning 3 columns |

### Form Validation

- Required fields with `required` attribute
- Rate/Hours: `min="0"`, `step` attributes
- Client name autocomplete via `<datalist>`
- Status select: draft/sent/paid/overdue
- `beforeunload` listener prevents navigation if `formDirty`

---

## 10. History (`js/components/history.js`)

| Function | Description |
|---|---|
| `renderHistory()` | Renders invoice history page with search bar, sort dropdown (date asc/desc, amount asc/desc), status filter, export/import buttons. |
| `renderHistoryTable(invoices, settings)` | Returns HTML table: Number, Client, Status (badge), Date, Due Date, Total, Actions (Edit, PDF, Visual PDF, Duplicate, Mark Paid, Delete). |
| `downloadPDF(id)` | Fetches invoice + settings, merges defaults, calls `generatePDF()`. |
| `downloadVisualPDF(id)` | Fetches invoice + settings, renders `renderLivePreview()` HTML into temp hidden div, calls `generatePDFFromHTML()`, cleans up. |
| `duplicateInvoice(id)` | Clones invoice with new number, date, and draft status. |
| `deleteInvoiceConfirm(id)` | Shows confirm modal, deletes on confirm. |
| `updateInvoiceStatus(id, status)` | Updates invoice status (typically 'paid'). |
| `exportInvoices()` | Creates JSON blob, triggers download as `invoices-backup-YYYY-MM-DD.json`. |
| `handleImportInvoices(event)` | Reads JSON file, validates array, upserts each invoice. |

---

## 11. Settings (`js/components/settings.js`)

| Function | Description |
|---|---|
| `renderSettings()` | Renders complete settings form with collapsible sections. |
| `saveSettingsForm()` | Reads all form values, determines selected template/color, calls `saveSettingsBulk()`. |
| `handleLogoUpload(e)` | Validates file ≤ 2MB, reads as data URL, saves to settings. |
| `removeLogo()` | Sets logo to null, updates preview. |
| `resetSettings()` | Shows confirm modal, calls `clearSettings()`, re-renders. |
| `getTemplatePreviewHTML(templateId, accent)` | Generates miniature HTML thumbnail for each template using `tp-*` CSS classes. |

### Settings Sections

1. **Your Information**: company name, email, phone, website, address
2. **Logo**: upload (max 2MB PNG/JPG), preview, remove
3. **Invoice Template**: grid of 17 templates with mini previews
4. **Accent Color**: 15 presets + custom `<input type="color">`
5. **Invoice Numbering & Currency**: prefix, currency (CAD/USD/EUR)
6. **Tax Settings**: TPS (5%), TVQ (9.975%) checkboxes
7. **Line Item Date Display**: date format (7 options), date position (rotated/inline)
8. **Column Widths (%)**: description, rate, hours, amount
9. **Defaults**: payment terms, notes
10. **Custom Labels**: 11 label fields for invoice terms + 4 column headers

---

## 12. Router (`js/app.js`)

| Function | Description |
|---|---|
| `initApp()` | Adds `hashchange` event listener, calls `handleRoute()`. |
| `handleRoute()` | Auth guard (redirects to login if not authenticated). Routes: `#/` → dashboard, `#/create` → form, `#/edit/:id` → form with id, `#/history` → history, `#/settings` → settings, `#/login` or `#/register` → auth, default → dashboard. |

---

## 13. CSS (`css/styles.css`)

### CSS Custom Properties

```css
:root {
  --bg: #f5f5f5;
  --surface: #ffffff;
  --text: #111111;
  --text-secondary: #666666;
  --border: #e5e5e5;
  --accent: #2563eb;
  --accent-hover: #1d4ed8;
  --accent-light: rgba(37, 99, 235, 0.08);
  --danger: #dc2626;
  --danger-hover: #b91c1c;
  --danger-light: rgba(220, 38, 38, 0.08);
  --success: #16a34a;
  --success-light: rgba(22, 163, 74, 0.08);
  --radius: 8px;
  --radius-lg: 12px;
  --shadow, --shadow-md, --shadow-lg: (multi-layer box shadows);
  --transition: 0.2s ease;
}
```

### Dark Mode (`[data-theme="dark"]`)

All custom properties overridden. Additional dark mode overrides for `tp-meta-line`, `tp-row.tp-row-alt`, `tp-cell`, `tp-grid-cell`, `tp-bold-divider`, `tp-compact-header`, `tp-compact-meta`, search bar focus, form focus, and template preview card backgrounds.

### Template-Specific Live Preview Table Styles

| Template | Table Header Style | Other |
|---|---|---|
| `classic` | No colored bg, black double border, serif italic font | Company in serif italic |
| `clean` | No colored bg, `2px solid #e5e5e5` bottom border, gray text | — |
| `elegant` | No colored bg, `2px solid #e5e5e5` bottom border, gray text, 0.08em letter-spacing | — |
| `bold` | Black `#111` background, white text, bold, 0.625rem | — |
| `grid` | Accent-colored bg + cell borders on every td | — |
| `corner` | Default (accent-colored) | Total border-top: 3px |
| `sidebar` | Default (accent-colored) | Invoice padding-left: 3.5rem |
| `subtle` | `#f8f8f8` background, `#666` text | — |
| `stripe` | `#111` background, white text | Even rows: `#f8f8f8` |
| `bordered` | Default (accent-colored) | Table: 2px solid border, 6px border-radius, overflow hidden |
| `compact` | Default (accent-colored) | Reduced padding (0.375rem 0.5rem), 0.75rem font, tighter spacing |
| `executive` | No colored bg, `2px solid #e5e5e5` bottom, `#666` uppercase, letter-spacing | No client border-bottom |
| `minimal` | No colored bg, `2px solid #e5e5e5` bottom, `#666` text | No client border-bottom |
| `divider` | No colored bg, `2px solid #e5e5e5` bottom, `#666` text | No client border-bottom |
| `dash` | No colored bg, `2px solid #e5e5e5` bottom, `#666` text | No client border-bottom |
| `swiss` | No colored bg, `2px solid #e5e5e5` bottom, `#666` uppercase, letter-spacing | No client border-bottom |

### Responsive Breakpoints

- **≤768px**: Nav column, form grid single column, preview column hidden, mobile preview button visible, dashboard stats 2-column, template grid 100px min, search bar column, button group column
- **≥769px**: Mobile preview overlay hidden, preview toggle button hidden

---

## 14. Server Backend (Node.js / Express / PostgreSQL)

### Database Schema (`server/db.js`)

```sql
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(50) PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  number VARCHAR(255) NOT NULL,
  date DATE,
  due_date DATE,
  client_name VARCHAR(255),
  client_email VARCHAR(255),
  client_address TEXT,
  line_items JSONB DEFAULT '[]',
  notes TEXT,
  template VARCHAR(50),
  accent_color VARCHAR(7),
  status VARCHAR(20) DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, number)
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  key VARCHAR(100) NOT NULL,
  value JSONB,
  UNIQUE(user_id, key)
);
```

### API Routes

**Auth (`server/routes/auth.js`)**
| Route | Method | Description |
|---|---|---|
| `/api/auth/register` | POST | Validates email+password, checks duplicates (409), bcrypt hashes, inserts user, returns JWT (7d expiry) + user object |
| `/api/auth/login` | POST | Validates email+password, verifies with bcrypt, returns JWT (7d expiry) + user object |

**Invoices (`server/routes/invoices.js`) — all require auth**
| Route | Method | Description |
|---|---|---|
| `/api/invoices` | GET | Returns all invoices for user, ordered by date DESC |
| `/api/invoices/:id` | GET | Returns single invoice by id + userId |
| `/api/invoices` | POST | Upserts invoice. If id exists for user: UPDATE. Otherwise: INSERT. |
| `/api/invoices/:id` | DELETE | Deletes invoice by id + userId |

**DB-to-API field mapping**: `due_date` → `dueDate`, `client_name` → `clientName`, `client_email` → `clientEmail`, `client_address` → `clientAddress`, `line_items` → `lineItems`, `accent_color` → `accentColor`, `created_at` → `createdAt`, `updated_at` → `updatedAt`

**Settings (`server/routes/settings.js`) — all require auth**
| Route | Method | Description |
|---|---|---|
| `/api/settings` | GET | Returns all settings for user as key-value object |
| `/api/settings/bulk` | PUT | Upserts all settings in a transaction (INSERT ON CONFLICT UPDATE) |
| `/api/settings` | DELETE | Deletes all settings for user |
| `/api/settings/next-invoice-number` | GET | Returns `{ prefix, year, num }`. Year-aware: resets to 1 on new year |
| `/api/settings/update-invoice-counter` | POST | Updates `invoicePattern` setting with `{ prefix, year, lastNum }` |
| `/api/settings/:key` | GET | Returns single setting value |
| `/api/settings/:key` | PUT | Upserts single setting key with `{ value }` body |

**Auth Middleware (`server/middleware/auth.js`)**
- Extracts Bearer token from Authorization header
- Verifies JWT with `process.env.JWT_SECRET`
- Sets `req.userId = decoded.userId`
- Returns 401 on missing/invalid token

### Environment Variables

```
DATABASE_URL=postgres://postgres:postgres@localhost:5432/invoices
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=3000
```

### Server Dependencies

- `express` ^4.18.2
- `pg` ^8.11.3
- `bcryptjs` ^2.4.3
- `jsonwebtoken` ^9.0.2
- `dotenv` ^16.3.1