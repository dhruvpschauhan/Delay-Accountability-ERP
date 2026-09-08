# Component Guide — IDAS Frontend

## Reusable Components

### InvoiceStatusChip
**File:** `src/components/invoice/InvoiceStatusChip.jsx`

Renders a colored MUI Chip for any stage name.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `stage` | string | required | The `current_stage` value from the invoice object |
| `size` | `"small"` \| `"medium"` | `"small"` | MUI Chip size |

```jsx
<InvoiceStatusChip stage="accounts_verification" />
// → Navy chip, label "Accounts Verification"
```

---

### StageTimeline
**File:** `src/components/invoice/StageTimeline.jsx`

Renders a vertical audit trail timeline with colored icons, durations, and delay type chips.

| Prop | Type | Description |
|------|------|-------------|
| `stageEvents` | array | Array of stage_event objects. **Must be passed in chronological order (oldest first).** The caller reverses `stage_events` from the API (which returns newest first) before passing them in. |

```jsx
const timelineEvents = [...invoice.stage_events].reverse();
<StageTimeline stageEvents={timelineEvents} />
```

---

### DelayBreakdown
**File:** `src/components/invoice/DelayBreakdown.jsx`

Computes and renders a stacked horizontal bar chart showing Store/Accounts/External delay attribution.

| Prop | Type | Description |
|------|------|-------------|
| `stageEvents` | array | Raw `stage_events` array from the API (no need to reverse) |

```jsx
<DelayBreakdown stageEvents={invoice.stage_events} />
```

---

### InvoiceTable
**File:** `src/components/invoice/InvoiceTable.jsx`

Full-featured invoice table with search, status/stage filters, skeleton loading, and click-to-navigate.

| Prop | Type | Description |
|------|------|-------------|
| `invoices` | array | Array of invoice objects |
| `loading` | boolean | Shows skeleton rows when true |
| `basePath` | string | Base URL for navigation (e.g., `/store`, `/accounts`, `/admin`) |

---

### LoadingSpinner
**File:** `src/components/common/LoadingSpinner.jsx`

Full-page centered `CircularProgress`. No props.

---

### ErrorAlert
**File:** `src/components/common/ErrorAlert.jsx`

| Prop | Type | Description |
|------|------|-------------|
| `message` | string | Error message to display |
| `onRetry` | function? | Optional retry callback; shows "Try Again" button |

---

### ConfirmDialog
**File:** `src/components/common/ConfirmDialog.jsx`

| Prop | Type | Description |
|------|------|-------------|
| `open` | boolean | Controls dialog visibility |
| `title` | string? | Dialog title (default: "Confirm Action") |
| `message` | string | Dialog body text |
| `onConfirm` | function | Called when user clicks Confirm |
| `onCancel` | function | Called when user clicks Cancel or closes dialog |

---

## Form Modals

All forms open as MUI Dialog modals and use `react-hook-form` for validation.

### CreateInvoiceForm
**File:** `src/components/forms/CreateInvoiceForm.jsx`

| Prop | Type | Description |
|------|------|-------------|
| `open` | boolean | Controls dialog visibility |
| `onClose` | function | Close callback |
| `onSuccess` | function(string) | Called with success message after creation |

### MaterialReceiptForm
**File:** `src/components/forms/MaterialReceiptForm.jsx`

| Prop | Type | Description |
|------|------|-------------|
| `open` | boolean | Controls dialog visibility |
| `onClose` | function | Close callback |
| `invoice` | object | The invoice object (for context display) |
| `onSuccess` | function(string) | Called with success message |

### InspectionForm
**File:** `src/components/forms/InspectionForm.jsx`

Same props as MaterialReceiptForm. Shows conditional warning when "Partial Acceptance" is selected.

### VerifyInvoiceForm
**File:** `src/components/forms/VerifyInvoiceForm.jsx`

Same props as MaterialReceiptForm. Shows conditional warning when "Yes — Raise Observations" is selected.
