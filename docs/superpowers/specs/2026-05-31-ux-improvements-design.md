# UX Improvements: Compact Smart Form + Quick-Add Presets

**Date:** 2026-05-31
**Status:** Approved
**Target user:** Freelancer/consultant who creates invoices for a few regular clients

## Problem

Creating a new invoice requires re-entering the same line items (descriptions, rates), dates, and notes every time. The form is a long single page with a large template/color picker that most users rarely change. There is no autosave — users can lose work if they navigate away.

## Approach

Keep the single-page form but make it dramatically faster with inline presets, smart pre-fill, a collapsed template/color row, and autosave. Four features, each independently valuable.

---

## Feature 1: Line Item Quick-Add Presets

### User-facing behavior

- A row of preset chips appears above the line items table in the invoice form
- Each chip shows the preset name and rate (e.g., "Software Dev — 85$/hr")
- Clicking a chip instantly adds a new line item row with description and rate pre-filled; the user only needs to enter hours and date
- A dashed "Add preset..." chip at the end opens an inline form to create a new preset without leaving the invoice page
- A "Manage Presets" link in the line items section header navigates to Settings

### Data model

Presets are stored as a JSON array in the existing `settings` table under key `lineItemPresets`, scoped per `user_id`:

```json
[
  { "id": "p1", "name": "Software Dev", "description": "Software development", "rate": 85, "hours": 8 },
  { "id": "p2", "name": "Consulting", "description": "Consulting services", "rate": 120, "hours": 1 },
  { "id": "p3", "name": "Code Review", "description": "Code review", "rate": 65 }
]
```

- `id`: unique string identifier (generated client-side)
- `name`: short label shown on the chip
- `description`: pre-fills the line item description field
- `rate`: numeric, pre-fills the rate field
- `hours`: optional, pre-fills hours if present (user can still change)

### Settings management

A new collapsible section "Line Item Presets" at the top of the Settings page with:

- Ordered list of presets with inline edit capability
- Drag-to-reorder (or up/down buttons for simplicity, matching existing pattern)
- Delete button per preset
- "Add Preset" button with a simple form: name, description, rate, default hours

### Affected files

- `js/templates.js` — add `lineItemPresets: []` to `getDefaultSettings()`
- `js/components/form.js` — render preset chips bar, handle chip click (add pre-filled row), handle "Add preset..." inline form
- `js/components/settings.js` — new "Line Item Presets" collapsible section with CRUD UI
- `css/styles.css` — preset chip styles, inline preset form styles

---

## Feature 2: Collapsed Template & Color Picker

### User-facing behavior

- The "Template & Color" card in the invoice form is collapsed by default to a single compact row (~50px tall)
- The row shows: a small template thumbnail, the template name, a color dot, and a chevron indicator
- Clicking the row expands an inline popover with the full 17-template grid and 15-color + custom picker
- Clicking outside the popover dismisses it
- Selecting a template or color immediately updates the live preview and the collapsed row display
- The full template grid and color picker remain in Settings unchanged

### Affected files

- `js/components/form.js` — replace the always-visible template/color card with a collapsed row + expandable popover
- `css/styles.css` — collapsed row styles, popover styles, transition animations

---

## Feature 3: Smart Pre-fill & "Reuse Last Invoice"

### 3a: Smart due date from payment terms

When creating a new invoice, the due date is calculated from the `paymentTerms` setting:

- `"Net 30"` → invoice date + 30 days
- `"Net 15"` → + 15 days
- `"Net 45"`, `"Net 60"`, etc. → parsed by extracting the number
- `"Due on Receipt"` or `"Due upon Receipt"` → same as invoice date
- Custom text with no parseable number → fallback to +30 days (current behavior)

This replaces the current hardcoded `Date.now() + 30 * 24 * 60 * 60 * 1000`.

### 3b: "Reuse last invoice" button

A new button in the line items section labeled "↻ Reuse last invoice":

- Queries the user's invoices, grouped by `clientName`, returns the most recent invoice per client
- **Single client with history:** Auto-imports that client's last invoice line items (descriptions + rates only, hours reset to empty) with a toast confirmation
- **Multiple clients with history:** Shows a small popover listing clients with their last invoice number and item count. User clicks one to import
- **No invoices yet:** Button is hidden or disabled
- Imported items are appended to any existing line items (does not clear current items)
- Dates auto-set using the existing `getNextWeekday()` logic

### New API endpoint

`GET /api/invoices/last-per-client` — returns an array of `{ clientName, invoiceNumber, itemCount, lineItems }` for the most recent invoice per unique client. This avoids fetching all invoices client-side.

Alternatively, reuse the existing `getAllInvoices()` and process client-side (simpler, no backend change). The client-side approach is preferred for now since invoice lists are typically small for freelancers.

### Affected files

- `js/utils.js` — add `parsePaymentTerms(terms)` function that returns number of days
- `js/components/form.js` — use `parsePaymentTerms()` for due date default; add "Reuse last invoice" button, popover, and import logic

---

## Feature 4: Autosave Drafts

### User-facing behavior

- Changes to the invoice form are auto-saved as draft 3 seconds after the last keystroke/change (debounced)
- A small status indicator below the page header shows three states:
  - **Amber dot + "Unsaved changes"** — form has been modified since last save
  - **Blue spinner + "Saving..."** — autosave in progress
  - **Green checkmark + "Draft auto-saved" + relative time** — save succeeded
- On network error: red text "Save failed — will retry" and the amber indicator stays
- The "Save Draft" button is removed from the action bar
- Ctrl+S becomes "force save now" (immediate, bypass debounce)
- The `beforeunload` warning is removed since changes are always saved
- "Save & Generate PDF" and "Visual PDF" buttons remain unchanged

### Autosave trigger conditions

- Only triggers if the form has at least a client name or one line item with content (prevents empty draft invoices)
- On new invoices: first autosave generates an invoice ID and sets status to `draft`. Subsequent autosaves update the same record
- On editing existing invoices: autosave updates the existing record

### Implementation details

- Reuse existing `saveInvoice()` API call (already does upsert)
- Debounce timer resets on every `input`/`change` event (integrate with existing `debouncedUpdatePreview` pattern)
- Track save state: `autosaveState` variable with values `'idle' | 'dirty' | 'saving' | 'saved' | 'error'`
- The `formDirty` flag is repurposed to track visual dirty state (for the indicator), while autosave handles actual persistence

### Affected files

- `js/components/form.js` — add autosave debounce logic, status indicator rendering, remove "Save Draft" button, remove `beforeunload` listener, update Ctrl+S handler
- `css/styles.css` — autosave status indicator styles (dot, spinner, checkmark animations)

---

## Out of scope

- Step-by-step wizard (too many clicks for power users)
- Per-client presets (presets are global for simplicity)
- Offline support / service worker
- Real-time collaboration
- Keyboard navigation beyond existing shortcuts

## Constraints

- Vanilla JS, no build step, no frameworks
- All persistence via existing Express + PostgreSQL backend
- Follow existing code patterns: global functions, `escapeHTML()` for innerHTML, `formatCurrency()` for money
- Support dark mode via `[data-theme="dark"]`
- No new database tables or schema changes (presets stored in existing `settings` table as JSONB)
