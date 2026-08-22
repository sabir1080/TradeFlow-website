/* ==========================================================================
   TradeFlow ERP — Analytics helper (Google Analytics 4)
   ==========================================================================
   Loaded once, at the top of <head>, before any other script.

   Configuration:
     window.GA_MEASUREMENT_ID is set inline in index.html, right before this
     file is loaded. Replace the placeholder value there with your real GA4
     Measurement ID (Google Analytics → Admin → Data Streams → your web
     stream → "Measurement ID", format G-XXXXXXXXXX).

   Behaviour:
     - If a real Measurement ID is configured, the standard Google tag
       (gtag.js) is loaded exactly once and a single automatic page_view is
       sent for this page load — there is no client-side routing on this
       site, so one page_view per load is correct and no extra page_view
       events are ever fired.
     - If the ID is still the placeholder (or missing), no request is made
       to Google at all — window.tfTrack() below still exists and simply
       does nothing, so no console errors occur anywhere else on the site.

     Every custom event on this site (pricing interactions, Print Agreement,
     the Interest form, CTA clicks, FAQ opens, screenshot views, section
     views) is funnelled through the single window.tfTrack(name, params)
     function below, so adding a new event anywhere in script.js is always
     a one-line call — this is the "one centralised tracking function"
     required for the analytics implementation.
   ========================================================================== */
(function () {
  'use strict';

  var GA_ID = window.GA_MEASUREMENT_ID || '';
  var isConfigured = /^G-[A-Z0-9]{6,}$/i.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX';

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // Guard against this file (or the gtag script) ever being loaded twice.
  if (isConfigured && !window.__tfGaLoaded) {
    window.__tfGaLoaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(s);

    gtag('js', new Date());
    // send_page_view defaults to true — exactly one page_view per load,
    // matching this site's single real HTML page.
    gtag('config', GA_ID);
  }

  /* window.tfTrack(eventName, params)
     Central event-tracking function used everywhere else on the site.
     Never sends personally identifiable information (name, email, phone,
     address, message text) — only plan/business/interaction data. */
  window.tfTrack = function (eventName, params) {
    if (!eventName) return;
    try {
      gtag('event', eventName, params || {});
    } catch (e) { /* never let analytics break the page */ }
  };
})();
