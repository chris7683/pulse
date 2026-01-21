# Ticketly (UI-only ticket selling website)

This is a **UI-only** ticket marketplace demo: browse events, pick ticket tiers + quantity, and preview a checkout-style summary. **No backend** and **no payments**.

## Run locally

- **Option A (recommended)**: use a tiny static server

```bash
cd /Users/apple/tickets
python3 -m http.server 5173
```

Then open `http://localhost:5173` in your browser.

- **Option B**: open directly

You can also double-click `index.html` to open it, but some browsers are pickier about `dialog` behavior on `file://` URLs.

## Files

- `index.html`: page + modals (ticket picker + checkout)
- `styles.css`: all styling
- `app.js`: sample events + UI interactions (search/filter/sort/cart/promo/toasts)


