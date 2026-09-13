# GPCL Owner Money Dashboard

Green Pastures Christmas Lights — owner cash view for the 2026 season.

Read-only phone-first page that answers **Where are we financially?**  
Data is a snapshot of the Bookkeeper **Cash Tracker** (`public/cash-dashboard.json`), not a live Sheet API.

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
npm run preview
```

## Deploy

**Do not use Netlify.** Host the static `dist/` output on **Cloudflare Pages**, **Surge**, or **GitHub Pages**.

Typical Cloudflare Pages settings: framework Vite, build command `npm run build`, output directory `dist`.

## Refresh the dashboard

When the Cash Tracker sheet changes, tell App Developer:

> **refresh the dashboard**

That rewrites `public/cash-dashboard.json` from the sheet. Details: `scripts/sync-note.md`.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`) — same GPCL palette as employee ops (`gpcl-700` `#1b5e3b`, cream `#faf8f4`)
- Loads `/cash-dashboard.json` via `fetch`

## What “Hard” means

**Hard** = cash actually in or out. Quoted is not revenue until collected.

## Brand

Warm forest greens, cream background, gold/red GPCL footer — outdoor/holiday service vibe, not SaaS purple.
