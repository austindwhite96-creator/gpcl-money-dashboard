# Cash Tracker sync

**Source of truth:** Google Sheet [GPCL 2026 Cash Tracker](https://docs.google.com/spreadsheets/d/1afAhRDk4iF0PIv9JL3Se7YBgjvITj4U0wSogT73e-xA)

## Live feed (preferred)

Apps Script Web App reads Dashboard / Transactions / Jobs and returns JSON (same shape as below).  
Money Dashboard loads `public/config.json` → `dashboardUrl` first, then falls back to the bundled snapshot `public/cash-dashboard.json`.

**Austin going forward**

1. Edit the Cash Tracker sheet (deposits, expenses, job payments).
2. Wait about **1 minute**.
3. Refresh Money Dashboard in the browser.

**No redeploy for data.** Redeploy only when the UI/code changes.

One-time: paste the Web App `/exec` URL into `public/config.json` as `dashboardUrl`, then redeploy once.  
Script source + deploy steps: `/workspace/gpcl-live-feeds/README.md`.

Until `dashboardUrl` is set, the app uses the snapshot — nothing breaks.

## Snapshot fallback

`public/cash-dashboard.json` is a backup copy. Keep it roughly in sync when you can, but it is **not** required for day-to-day sheet edits once the live URL is set.

~~Tell App Developer “refresh the dashboard”~~ — **not needed for data anymore.**

## Shape of the JSON

```json
{
  "syncedFrom": "GPCL 2026 Cash Tracker",
  "sheetId": "1afAhRDk4iF0PIv9JL3Se7YBgjvITj4U0wSogT73e-xA",
  "syncedAt": "ISO-8601",
  "hardRevenue": 0,
  "hardExpenses": 0,
  "netCashProfit": 0,
  "cashMargin": null,
  "receiptsNeeded": 0,
  "categories": [{ "name": "Materials", "total": 0 }],
  "jobs": [{ "address": "", "customer": "", "quoteId": "", "quotedRevenue": 0, "revenueCollected": 0, "hardProfit": 0, "notes": "" }],
  "recentTransactions": [{ "date": "YYYY-MM-DD", "type": "Expense", "vendor": "", "category": "", "description": "", "moneyIn": 0, "moneyOut": 0 }]
}
```

**Hard** = cash actually in/out. Quoted is not revenue until collected.
