/**
 * How many FUTURE months of the Netlify hosting bill to count in the projected bottom line.
 * Each month costs the amount of the latest Netlify charge in the Cash Tracker (read from the feed).
 *
 *   0 = Netlify goes to the Free plan on Oct 13, 2026: no future bills, nothing projected (current setting).
 *   2 = if it ever comes back at the paid plan: October + November.
 */
export const NETLIFY_MONTHS_PROJECTED = 0
