# TradeFlow ERP — Marketing Website

A responsive, static marketing website for **TradeFlow ERP** and custom software
development services by Sabir Shah.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Full page structure and content |
| `styles.css` | Design system — tokens, components, dark/light themes, responsive rules |
| `script.js` | Theme toggle, navigation, gallery rendering, filters, lightbox, tabs |
| `404.html` | Not-found page (uses the same design system) |
| `assets/screens/` | 45 real TradeFlow application screenshots (WebP) |
| `assets/logo/` | Brand logo variants |

## Design

- **Dark-first** design with a **light theme toggle**. The choice is saved in
  `localStorage` under `tf-theme`, and applied inline in `<head>` so the page
  never flashes the wrong theme on load. First-time visitors get whatever their
  OS prefers.
- All colours, spacing, radii and shadows are CSS custom properties defined in
  `:root` (dark) and overridden under `[data-theme="light"]`. To rebrand, change
  the `--brand-*` tokens at the top of `styles.css` — nothing else needs editing.
- Fonts: **Sora** (headings) and **Inter** (body), loaded from Google Fonts.

## Sections

Hero → module features → 45-screen product tour → module deep-dive tabs →
industries → pricing → custom software → process → technology → testimonials →
about → portfolio → FAQ → contact CTA → footer.

## Screenshot gallery

The gallery is **generated from the `SCREENS` array in `script.js`** rather than
hand-written HTML. Each entry is `[file index, category, title, description]`.

To add or edit a screen:

1. Drop the image in `assets/screens/` as `screen-NN.webp`.
2. Add a row to `SCREENS`.

Filter buttons and their counts build themselves from the categories in that
array, so no other file needs touching. The three featured tiles at the top of
the section reference screens by file index via `data-screen="N"`.

The lightbox opens from any element with a `data-screen` attribute, supports
arrow keys, Escape, click-outside and touch swipe.

## Run locally

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to Cloudflare Pages

1. Push these files to a GitHub repository.
2. In Cloudflare Pages, connect the repository.
3. Framework preset: **none / static**.
4. Build command: leave empty.
5. Output directory: `/`
6. Deploy.

Fully static — no database or backend required.

## Before publishing — check these

- [ ] **Pricing figures** in the `#pricing` section are placeholders
      (Rs. 45,000 / Rs. 120,000 / from Rs. 250,000). Replace with your real rates.
- [ ] **Testimonials** in the `#testimonials` section are illustrative.
      Replace with real client feedback, or remove the section.
- [ ] **FAQ answers** — confirm the support period, user limits, deployment
      options and implementation timelines match what you actually offer.
- [ ] `<link rel="canonical">` in `index.html` — set to your real domain.
- [ ] Contact details are set to `sabir1212@yahoo.com` and `+92 345 3231545`.
