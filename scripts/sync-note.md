# Cash Tracker sync (one step)

**Source of truth:** Google Sheet [GPCL 2026 Cash Tracker](https://docs.google.com/spreadsheets/d/1gE7i8TOD_SkMt2XOlOQkdWg_v3PwvIrDw8YNH8BTzIw)

**What the app reads:** `public/cash-dashboard.json` (snapshot — not a live Sheet API)

## One-step refresh (for Austin)

When you change the Cash Tracker sheet (new deposit, expense, job payment, etc.):

> **Tell App Developer: `refresh the dashboard`**

That’s it. The assistant will:

1. Pull the latest Sheet
2. Rewrite `public/cash-dashboard.json`
3. Redeploy the static host (Cloudflare Pages / Surge / GH Pages — **not Netlify**)

## Shape of the JSON

```json
{
  "syncedFrom": "GPCL 2026 Cash Tracker",
  "sheetId": "1gE7i8TOD_SkMt2XOlOQkdWg_v3PwvIrDw8YNH8BTzIw",
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
