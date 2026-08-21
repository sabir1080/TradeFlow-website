# TradeFlow ERP — Marketing Website

A responsive, static marketing website for **TradeFlow ERP** and custom software
development services by Sabir Shah.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Full page structure and content |
| `styles.css` | Design system — tokens, components, dark/light themes, responsive rules |
| `script.js` | Theme toggle, navigation, gallery rendering, filters, lightbox, tabs, pricing/agreement/enquiry logic, analytics event tracking |
| `analytics.js` | Google Analytics 4 (GA4) loader and the central `tfTrack()` event helper — see "Analytics (GA4)" below |
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

## Analytics (GA4)

The site ships with a Google Analytics 4 (GA4) integration in `analytics.js`
(loaded first, at the top of `<head>` in `index.html`) plus event tracking
calls added throughout `script.js`. Nothing was hard-coded — there is no
fake Measurement ID anywhere, and until you configure a real one, no
requests are sent to Google and no console errors occur.

### Set your Measurement ID

In `index.html`, near the top of `<head>`:

```html
<script>window.GA_MEASUREMENT_ID = 'G-XXXXXXXXXX';</script>
<script src="analytics.js"></script>
```

Replace `'G-XXXXXXXXXX'` with your real GA4 Measurement ID (Google
Analytics → Admin → Data Streams → your web stream → "Measurement ID").
That's the only change required — every event below starts sending
automatically once a real ID is in place.

### How it's wired up

- `analytics.js` loads the standard Google tag (`gtag.js`) exactly once,
  and GA4's automatic `page_view` fires once per page load (this is a
  single real HTML page with no client-side routing, so there is never a
  duplicate `page_view`).
- Every custom event across the site goes through one function,
  `window.tfTrack(eventName, params)`, defined in `analytics.js`. Adding a
  new event anywhere is always a one-line call to `tfTrack(...)`.
- Section-level visibility (Home, Platform, Screens, Pricing, FAQ,
  Contact, etc.) is tracked with a separate custom event, `section_view`,
  rather than firing extra `page_view` events — this avoids polluting
  GA4's landing-page/exit-page reports, which are based on real
  `page_view`s.

### Events implemented

| Event | Fired when | Key parameters |
| --- | --- | --- |
| `section_view` | A section (Home, Platform, Screens, Modules, Industries, Pricing, Custom, FAQ, About, Contact) is scrolled into view, once each | `section_id` |
| `pricing_plan_viewed` | A pricing card is ≥50% visible, once per plan | `plan_name`, `plan_id`, `license_type`, `currency`, `price`, `setup_fee`, `monthly_fee` |
| `pricing_license_changed` | Perpetual/Subscription toggle is switched | `previous_license`, `new_license`, `currency` |
| `pricing_currency_changed` | PKR/USD toggle is switched | `previous_currency`, `new_currency` |
| `print_agreement_clicked` | "Print Agreement" button clicked on a plan | `plan_name`, `plan_id`, `license_type`, `currency`, `price`, `setup_fee`, `monthly_fee` |
| `interest_form_opened` | "I'm Interested" / "Book a Demo" button clicked | same pricing parameters as above |
| `interest_form_started` | Visitor types into the Interest form for the first time after opening it | same pricing parameters as above |
| `interest_form_validation_error` | Interest form submitted with missing/invalid required fields | `error_fields` (comma-separated field *names* only, e.g. `"email,phone"`) |
| `interest_form_submitted` | Interest form submitted successfully | same pricing parameters as above (no client details) |
| `cta_clicked` | Any element with `data-cta="..."` is clicked (nav CTA, hero CTAs, WhatsApp/Email/contact links, footer links, Print Agreement, I'm Interested) | `cta_name` |
| `faq_opened` | A FAQ `<details>` is expanded | `question` (truncated to 80 chars) |
| `screenshot_opened` | A screenshot is opened in the lightbox (grid or featured tiles) | `image_name`, `section` |

Note on `pricing_license_changed` / `pricing_currency_changed`: the site's
licence and currency toggles apply globally to every plan shown at once —
there is no single "currently selected plan" concept until a visitor
clicks Print Agreement or I'm Interested on a specific card — so these two
events intentionally omit a `selected_plan` parameter rather than
fabricate one. Per-plan interest is captured precisely by
`pricing_plan_viewed`, `print_agreement_clicked` and `interest_form_*`.

GA4 also captures device, browser, OS, country/region, language, screen
size, traffic source (direct/organic/referral/social) and campaign
(`utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`)
automatically — nothing in this site strips or rewrites query parameters,
so links like
`https://yourdomain.com/?utm_source=facebook&utm_medium=social&utm_campaign=tradeflow_launch`
attribute correctly with no further changes needed.

### Privacy

No personally identifiable information is ever sent to GA4. The Interest
form and Print Agreement forms still collect name, email, phone, address
and message text as before (unchanged), but analytics events only ever
carry plan/business data (plan name, plan ID, licence type, currency,
price, setup fee, monthly fee) or generic interaction data (CTA name, FAQ
question text, section ID, screenshot name) — never form field values.

### Consent / cookies

This is a simple static B2B marketing site with no login, no ads, no
cross-site tracking and no PII sent to analytics — the standard reason a
cookie/consent banner is required (e.g. under the EU's ePrivacy Directive)
is to gate non-essential tracking cookies for EU visitors. Given the
current setup, a consent banner was intentionally **not** added, to avoid
unnecessary UI friction that this task also asked to avoid. If the
business later runs paid campaigns targeting EU visitors or wants
strict GDPR/ePrivacy compliance, add a consent step before the `gtag.js`
script tag is injected in `analytics.js` (e.g. gate the `isConfigured`
block behind a stored consent flag) — the code is centralized there
specifically to make that a small, contained change later.

## Before publishing — check these

- [ ] **Pricing figures** in the `#pricing` section are placeholders
      (Rs. 45,000 / Rs. 120,000 / from Rs. 250,000). Replace with your real rates.
- [ ] **Testimonials** in the `#testimonials` section are illustrative.
      Replace with real client feedback, or remove the section.
- [ ] **FAQ answers** — confirm the support period, user limits, deployment
      options and implementation timelines match what you actually offer.
- [ ] `<link rel="canonical">` in `index.html` — set to your real domain.
- [ ] Contact details are set to `sabir1212@yahoo.com` and `+92 345 3231545`.
