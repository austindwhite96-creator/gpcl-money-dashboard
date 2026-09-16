# GPCL Owner Money Dashboard

Green Pastures Christmas Lights — owner cash view for the 2026 season.

Read-only phone-first page that answers **Where are we financially?**  
Data comes from the Bookkeeper **Cash Tracker** via a live JSON feed when configured (`public/config.json` → `dashboardUrl`), with fallback to the bundled snapshot `public/cash-dashboard.json`.

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

Edit the Cash Tracker sheet → wait ~1 minute → refresh this site. **No redeploy for data.**

One-time: paste the Apps Script Web App URL into `public/config.json` as `dashboardUrl`, then redeploy once. Details: `scripts/sync-note.md` and `/workspace/gpcl-live-feeds/README.md`.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`) — same GPCL palette as employee ops (`gpcl-700` `#1b5e3b`, cream `#faf8f4`)
- Loads live feed URL (if set) or `/cash-dashboard.json` via `fetch`

## What “Hard” means

**Hard** = cash actually in or out. Quoted is not revenue until collected.

## Brand

Warm forest greens, cream background, gold/red GPCL footer — outdoor/holiday service vibe, not SaaS purple.
