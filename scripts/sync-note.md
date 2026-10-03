# Cash Tracker sync

**Source of truth:** Google Sheet [GPCL 2026 Cash Tracker](https://docs.google.com/spreadsheets/d/1psIydzf3x-kdWXGmljrcbQlpOZ9wA_WMwrKcakecN0Q)

## Private live feed

An Apps Script Web App reads the Dashboard / Transactions / Jobs / Crew Pay Policy tabs (read-only) and returns JSON.
The page loads `public/config.json` → `dashboardUrl` and sends `?key=<access key>`.

- The feed answers `{"error":"unauthorized"}` (no data) unless the key matches the `DASHBOARD_KEY` Script Property.
- The feed strips phone numbers, emails, street addresses, raw Notes, quote IDs and crew names on the server.
- There is **no bundled snapshot** any more. A snapshot in a public repo is public data.
- The key is **never** in this repo or in the built page. Austin opens his personal link once
  (`…/gpcl-money-dashboard/#k=<key>`); the page saves the key in the browser and removes it from the address bar.
  Without a key the page only shows "Enter access key".

Cutover steps: `/workspace/gpcl-dashboard-preview/CUTOVER.md`.

## Data going forward

1. Edit the Cash Tracker sheet (deposits, expenses, job payments).
2. Wait about **1 minute** (the feed caches for 60 seconds).
3. Reopen the Money Dashboard.

No redeploy for data. Redeploy only when the UI/code changes.

## Shape of the JSON (sanitized)

```json
{
  "syncedFrom": "GPCL 2026 Cash Tracker", "syncedAt": "ISO-8601",
  "hardRevenue": 0, "hardExpenses": 0, "netCashProfit": 0, "cashMargin": null, "receiptsNeeded": 0,
  "salesTaxHeld": 0,
  "categories": [{ "name": "Materials", "total": 0 }],
  "jobs": [{ "id": "job-1", "name": "Dan B.", "jobDate": "YYYY-MM-DD", "status": "Booked", "quotedRevenue": 0, "revenueCollected": 0 }],
  "recentTransactions": [{ "date": "YYYY-MM-DD", "type": "Expense", "vendor": "", "category": "", "description": "", "moneyIn": 0, "moneyOut": 0 }],
  "recurring": [{ "label": "Netlify", "monthly": 9, "lastPostedMonth": "YYYY-MM", "kind": "other" }],
  "plannedIncome": { "jobs": [{ "id": "", "name": "", "installDate": "", "status": "", "quotedPreTax": 0, "collected": 0,
    "stillExpected": 0, "deposit": 0, "taxable": false, "salesTaxExpected": 0, "salesTaxCollected": 0,
    "materialsPlanned": 0, "materialsBought": 0, "otherDirect": 0, "crewPay": 0, "ownerPay": 0, "flags": [] }] }
}
```

## Money rules on the page

- **Hard** = cash actually in/out. Quoted is not revenue until collected.
- Sales tax is a liability owed to the state, never revenue ("Held for the state").
- Austin's own pay is profit, not a cost. **GPCL keeps** = quoted − crew pay (excluding Austin) − materials − lead fee.
- Remaining balance = unpaid pre-tax amount + (sales tax expected − sales tax collected).
- Materials ("Planned Materials" column on Jobs, or an "Expected materials cost about $X" sentence in the job note)
  flow into the projected bottom line automatically when Bookkeeper adds them. Other monthly bills (e.g. insurance, a
  "recurring $X/mo" row) come from the feed's `recurring` list. Netlify is the exception: its projection is
  `NETLIFY_MONTHS_PROJECTED` in `src/config.ts` x the latest Netlify charge in the tracker. It is 0 now (Netlify goes to
  the Free plan Oct 13, 2026), so no Netlify bill is projected. Nothing is guessed.
