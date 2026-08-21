/* ==========================================================================
   TradeFlow ERP — site behaviour
   ========================================================================== */
(function () {
  'use strict';

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------------
     1. Theme toggle — persisted in localStorage.
     The initial value is applied inline in <head> to avoid a flash.
     ------------------------------------------------------------------ */
  var root = document.documentElement;
  var themeBtn = $('#themeToggle');

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('tf-theme', theme); } catch (e) {}
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f8fc' : '#060a13');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      setTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
  }

  /* ------------------------------------------------------------------
     2. Navigation — mobile menu, scrolled state, active link
     ------------------------------------------------------------------ */
  var menuToggle = $('#menuToggle');
  var navLinks   = $('#navLinks');
  var navWrap    = $('#navWrap');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      menuToggle.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    $$('a', navLinks).forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        menuToggle.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var sections = $$('main section[id]');
  var navAnchors = navLinks ? $$('a', navLinks) : [];

  function onScroll() {
    if (navWrap) navWrap.classList.toggle('scrolled', window.scrollY > 8);

    var pos = window.scrollY + 140;
    var currentId = '';
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) currentId = sec.id;
    });
    navAnchors.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + currentId);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ------------------------------------------------------------------
     3. Scroll reveal
     ------------------------------------------------------------------ */
  var io = 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
    : null;

  function observeReveals(scope) {
    $$('.reveal', scope).forEach(function (el) {
      if (io) io.observe(el); else el.classList.add('visible');
    });
  }
  observeReveals(document);

  /* ------------------------------------------------------------------
     4. Module deep-dive tabs
     ------------------------------------------------------------------ */
  var deepTabs = $$('.deep-tab');
  deepTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var panel = $('#' + tab.getAttribute('aria-controls'));
      deepTabs.forEach(function (t) {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      $$('.deep-panel').forEach(function (p) { p.classList.remove('active'); p.hidden = true; });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      if (panel) { panel.hidden = false; panel.classList.add('active'); }
    });
  });

  /* ------------------------------------------------------------------
     5. Screens gallery — data
     Each entry: [file index, category, title, description]
     ------------------------------------------------------------------ */
  var SCREENS = [
    [0,  'Overview',       'Login',                    'Secure sign-in and account access'],
    [1,  'Overview',       'ERP Overview',             'TradeFlow ERP overview and workspace'],
    [2,  'Overview',       'Business Dashboard',       'Real-time business dashboard'],
    [3,  'Inventory',      'Edit Item',                'Product and item master management'],
    [4,  'Inventory',      'Items',                    'Complete item and product listing'],
    [5,  'Inventory',      'Item Ledger',              'Detailed inventory item ledger'],
    [6,  'Sales & POS',    'Point of Sale',            'Integrated point-of-sale workflow'],
    [7,  'Partners',       'Suppliers',                'Supplier management'],
    [8,  'Partners',       'Customers',                'Customer management'],
    [9,  'Sales & POS',    'Held Bills',               'Held and pending POS bills'],
    [10, 'Purchasing',     'Purchases',                'Purchase transaction management'],
    [11, 'Purchasing',     'Purchase Invoice',         'Purchase invoice details'],
    [12, 'Sales & POS',    'Sales',                    'Sales transaction management'],
    [13, 'Sales & POS',    'Sales Invoice',            'Sales invoice details'],
    [14, 'Reports',        'Reports',                  'Central reporting workspace'],
    [15, 'Inventory',      'Inventory Report',         'Inventory and stock reporting'],
    [16, 'Reports',        'Stock Analysis',           'Stock and operational analysis'],
    [17, 'Accounting',     'Profit & Loss',            'Profit and Loss statement'],
    [18, 'Accounting',     'Balance Sheet',            'Balance Sheet'],
    [19, 'Accounting',     'Cash Flow',                'Cash Flow statement'],
    [20, 'Accounting',     'Trial Balance',            'Trial Balance'],
    [21, 'Accounting',     'Accounts Aging',           'Accounts aging report'],
    [22, 'Accounting',     'Cash Book',                'Cash Book'],
    [23, 'Accounting',     'Subledger Reconciliation', 'Subledger reconciliation'],
    [24, 'Accounting',     'Tax Summary',              'Tax summary and tax reporting'],
    [25, 'Accounting',     'Chart of Accounts',        'Chart of Accounts'],
    [26, 'Accounting',     'Journal Entries',          'Journal entry listing'],
    [27, 'Accounting',     'Journal Entry',            'Detailed journal entry'],
    [28, 'Accounting',     'Cash & Bank Accounts',     'Cash and bank account management'],
    [29, 'Accounting',     'Bank Ledger',              'Bank ledger'],
    [30, 'Accounting',     'Cash Ledger',              'Cash ledger'],
    [31, 'Assets',         'Fixed Asset Register',     'Fixed asset register and depreciation'],
    [32, 'Operations',     'Delivery Van',             'Delivery and operational tracking'],
    [33, 'Administration', 'Fiscal Years & Periods',   'Fiscal year and accounting period controls'],
    [34, 'Administration', 'Tax Codes',                'Tax code configuration'],
    [35, 'Administration', 'User Management',          'Users, roles and access management'],
    [36, 'Accounting',     'Financial Accounts',       'Financial account configuration'],
    [37, 'Administration', 'Business Configuration',   'Business-wide configuration'],
    [38, 'Administration', 'Audit Log',                'System audit trail'],
    [39, 'Administration', 'Backup & Restore',         'Database backup and restore controls'],
    [40, 'Administration', 'System Controls',          'System control and maintenance screen'],
    [41, 'Help',           'User Manual',              'Built-in user manual'],
    [42, 'About',          'About',                    'About TradeFlow and its business-first approach'],
    [43, 'Administration', 'Developer Access',         'Secure developer and administration access'],
    [44, 'Administration', 'Developer Tasks Panel',    'Advanced administration and diagnostic tools']
  ];

  var CATEGORY_LABELS = { 'Partners': 'Customers & Suppliers' };

  function src(i) {
    return 'assets/screens/screen-' + String(i).padStart(2, '0') + '.webp';
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* --- Render the grid ------------------------------------------------ */
  var grid = $('#screenGrid');
  if (grid) {
    grid.innerHTML = SCREENS.map(function (s, idx) {
      var file = s[0], cat = s[1], title = s[2], desc = s[3];
      return '<article class="screen-card reveal" data-category="' + esc(cat) + '">' +
        '<button class="screen-thumb" type="button" data-screen="' + file + '" ' +
          'aria-label="Open ' + esc(title) + ' screenshot full size">' +
          '<img src="' + src(file) + '" alt="TradeFlow ' + esc(title) + ' screen" ' +
            'loading="' + (idx < 6 ? 'eager' : 'lazy') + '" decoding="async">' +
          '<span class="zoom-badge" aria-hidden="true">↗</span>' +
        '</button>' +
        '<div class="screen-meta">' +
          '<span>' + esc(cat.toUpperCase()) + '</span>' +
          '<h3>' + esc(title) + '</h3>' +
          '<p>' + esc(desc) + '</p>' +
        '</div>' +
      '</article>';
    }).join('');
    observeReveals(grid);
  }

  /* --- Render the filter bar ----------------------------------------- */
  var filterBar = $('#filterBar');
  if (filterBar) {
    var counts = {};
    SCREENS.forEach(function (s) { counts[s[1]] = (counts[s[1]] || 0) + 1; });

    // Order categories by how many screens each has, so the busiest come first.
    var cats = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });

    var html = '<button class="filter-btn active" data-filter="All">All <b>' + SCREENS.length + '</b></button>';
    html += cats.map(function (c) {
      return '<button class="filter-btn" data-filter="' + esc(c) + '">' +
        esc(CATEGORY_LABELS[c] || c) + ' <b>' + counts[c] + '</b></button>';
    }).join('');
    filterBar.innerHTML = html;

    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter-btn');
      if (!btn) return;
      var filter = btn.dataset.filter;
      $$('.filter-btn', filterBar).forEach(function (b) { b.classList.toggle('active', b === btn); });
      $$('.screen-card', grid).forEach(function (card) {
        card.classList.toggle('is-hidden', filter !== 'All' && card.dataset.category !== filter);
      });
    });
  }

  /* ------------------------------------------------------------------
     6. Lightbox — shared by the gallery and the featured trio.
     Navigation always walks the full SCREENS list.
     ------------------------------------------------------------------ */
  var lightbox = $('#lightbox');
  var lbImage  = $('#lightboxImage');
  var lbCaption = $('#lightboxCaption');
  var lastFocused = null;
  var current = 0;

  function indexOfFile(file) {
    for (var i = 0; i < SCREENS.length; i++) if (SCREENS[i][0] === file) return i;
    return 0;
  }

  function openScreen(i) {
    if (!lightbox || !SCREENS[i]) return;
    current = i;
    var s = SCREENS[i];
    lbImage.src = src(s[0]);
    lbImage.alt = 'TradeFlow ' + s[2] + ' — ' + s[3];
    lbCaption.textContent = s[2] + '  •  ' + s[1] + '  •  ' + (i + 1) + ' / ' + SCREENS.length;
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('.lightbox-close', lightbox).focus();
  }

  function closeScreen() {
    if (!lightbox) return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  function move(step) {
    openScreen((current + step + SCREENS.length) % SCREENS.length);
  }

  // Any element carrying data-screen (grid thumb or featured tile) opens the viewer.
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-screen]');
    if (!trigger) return;
    lastFocused = trigger;
    openScreen(indexOfFile(parseInt(trigger.dataset.screen, 10)));
  });

  if (lightbox) {
    $('.lightbox-close', lightbox).addEventListener('click', closeScreen);
    $('.lightbox-prev', lightbox).addEventListener('click', function () { move(-1); });
    $('.lightbox-next', lightbox).addEventListener('click', function () { move(1); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeScreen(); });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeScreen();
      else if (e.key === 'ArrowLeft') move(-1);
      else if (e.key === 'ArrowRight') move(1);
    });

    // Swipe between screenshots on touch devices.
    var startX = 0;
    lightbox.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 55) move(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------
     7. Pointer-tracked glow on the feature cards
     ------------------------------------------------------------------ */
  if (matchMedia('(hover: hover)').matches) {
    $$('.feature').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        card.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ------------------------------------------------------------------
     8. Footer year
     ------------------------------------------------------------------ */
  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------
     9. Pricing — licence type (Perpetual / Subscription) and
     currency (PKR / USD) toggles.
     Each .price card carries its own fixed figures as data attributes
     (set from the official price list, not derived/converted), and
     the toggles just switch which figure is displayed.
     ------------------------------------------------------------------ */
  var priceGrid = $('#priceGrid');
  if (priceGrid) {
    var licenseBtns  = $$('.license-btn');
    var currencyBtns = $$('.currency-btn');
    var priceCards   = $$('.price', priceGrid);

    var CURRENCY_PREFIX = { pkr: 'Rs. ', usd: '$' };
    var state = { license: 'perpetual', currency: 'pkr' };

    function renderPrices() {
      priceCards.forEach(function (card) {
        var figEl = $('.price-main-fig', card);
        var unitEl = $('.price-main-unit', card);
        var subEl = $('.price-sub-fig', card);
        if (!figEl) return;

        var prefix = CURRENCY_PREFIX[state.currency];

        if (state.license === 'perpetual') {
          var amount = card.dataset['perpetual' + (state.currency === 'pkr' ? 'Pkr' : 'Usd')];
          figEl.textContent = prefix + amount;
          unitEl.textContent = 'one-time';
          subEl.textContent = 'Perpetual licence • 3 months free maintenance & support';
        } else {
          var setup = card.dataset['setup' + (state.currency === 'pkr' ? 'Pkr' : 'Usd')];
          var monthly = card.dataset['monthly' + (state.currency === 'pkr' ? 'Pkr' : 'Usd')];
          figEl.textContent = prefix + setup;
          unitEl.textContent = 'setup fee';
          subEl.textContent = '+ ' + prefix + monthly + ' / month subscription';
        }
      });
    }

    licenseBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.license = btn.dataset.license;
        licenseBtns.forEach(function (b) {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        renderPrices();
      });
    });

    currencyBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        state.currency = btn.dataset.currency;
        currencyBtns.forEach(function (b) {
          b.classList.toggle('active', b === btn);
          b.setAttribute('aria-selected', String(b === btn));
        });
        renderPrices();
      });
    });

    renderPrices();

    /* ----------------------------------------------------------------
       9a. Shared plan-details config — single source of truth for the
       module/feature list used by both Print Agreement and
       I'm Interested. Keyed by data-plan-id on each .price card.
       ---------------------------------------------------------------- */
    var PLAN_MODULES = {
      'business': [
        'Inventory / Stock Management',
        'Sales, Services & Point of Sale (POS)',
        'Purchasing & Purchase Orders',
        'Customers & Suppliers, with balances',
        'Business & Operational Reports'
      ],
      'business-accounting': [
        'Everything in TradeFlow Business',
        'Chart of Accounts',
        'Journal Entries',
        'General Ledger',
        'Receivables & Payables',
        'Customer Receipts',
        'Supplier Payments',
        'Trial Balance',
        'Profit & Loss',
        'Balance Sheet'
      ],
      'business-hr': [
        'Everything in TradeFlow Business',
        'HR & Employee Management',
        'Attendance',
        'Leave Management',
        'Payroll',
        'HR / Attendance / Payroll Reports'
      ],
      'erp': [
        'Everything in TradeFlow Business',
        'Everything in Business Accounting',
        'HR & Payroll',
        'Attendance',
        'Fixed Assets',
        'Depreciation',
        'Priority Setup',
        'Data Migration'
      ]
    };

    /* ----------------------------------------------------------------
       9b. getCurrentPricingState(card) — reads the CURRENT licence
       and currency toggle state together with one card's fixed data
       attributes, and returns a single normalised object. Both the
       Print Agreement flow and the I'm Interested flow read pricing
       exclusively through this function, so there is exactly one
       place that turns UI state + data attributes into a price.
       ---------------------------------------------------------------- */
    function getCurrentPricingState(card) {
      var currencyKey = state.currency === 'pkr' ? 'Pkr' : 'Usd';
      var prefix = CURRENCY_PREFIX[state.currency];
      var planName = ($('h3', card) || {}).textContent || '';
      var planId = card.dataset.planId || '';

      var result = {
        planId: planId,
        planName: planName,
        licenseType: state.license === 'perpetual' ? 'Perpetual Licence' : 'Subscription Licence',
        licenseKey: state.license,
        currency: state.currency.toUpperCase(),
        currencyPrefix: prefix,
        modules: PLAN_MODULES[planId] || []
      };

      if (state.license === 'perpetual') {
        result.price = prefix + card.dataset['perpetual' + currencyKey];
        result.priceLabel = 'Purchase Price';
      } else {
        result.setupFee = prefix + card.dataset['setup' + currencyKey];
        result.monthlyFee = prefix + card.dataset['monthly' + currencyKey];
        result.priceLabel = 'Setup Fee';
        result.price = result.setupFee;
      }

      return result;
    }

    /* ----------------------------------------------------------------
       9c. Small modal helpers, shared by both dialogs.
       ---------------------------------------------------------------- */
    function openModal(modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.documentElement.classList.add('modal-open');
      document.body.style.overflow = 'hidden';
    }
    function closeModal(modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('modal-open');
      document.body.style.overflow = '';
    }
    $$('.modal').forEach(function (modal) {
      $$('[data-modal-close]', modal).forEach(function (btn) {
        btn.addEventListener('click', function () { closeModal(modal); });
      });
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal(modal);
      });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      $$('.modal.open').forEach(closeModal);
    });

    function planSummaryHTML(p) {
      var rows = '';
      rows += '<div class="msum-row"><span>Selected Plan</span><b>' + esc(p.planName) + '</b></div>';
      rows += '<div class="msum-row"><span>Licence</span><b>' + esc(p.licenseType) + '</b></div>';
      rows += '<div class="msum-row"><span>Currency</span><b>' + esc(p.currency) + '</b></div>';
      if (p.licenseKey === 'perpetual') {
        rows += '<div class="msum-row"><span>Purchase Price</span><b>' + esc(p.price) + '</b></div>';
      } else {
        rows += '<div class="msum-row"><span>Setup Fee</span><b>' + esc(p.setupFee) + '</b></div>';
        rows += '<div class="msum-row"><span>Monthly Subscription</span><b>' + esc(p.monthlyFee) + '</b></div>';
      }
      return rows;
    }

    /* ==================================================================
       10. "I'm Interested" enquiry flow
       ================================================================== */
    var interestModal = $('#interestModal');
    var interestForm = $('#interestForm');
    var activeInterestCard = null;

    $$('.price-action-interest', priceGrid).forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeInterestCard = btn.closest('.price');
        var p = getCurrentPricingState(activeInterestCard);
        $('#interestPlanSummary').innerHTML = planSummaryHTML(p);
        $('#interestStepForm').hidden = false;
        $('#interestStepSuccess').hidden = true;
        interestForm.reset();
        $$('.form-field', interestForm).forEach(function (f) { f.classList.remove('has-error'); });
        openModal(interestModal);
      });
    });

    function validateInterestForm(data) {
      var errors = {};
      if (!data.company.trim()) errors.company = 'Company name is required.';
      if (!data.contact.trim()) errors.contact = 'Contact person is required.';
      if (!data.phone.trim()) errors.phone = 'Phone / WhatsApp number is required.';
      if (!data.email.trim()) {
        errors.email = 'Email is required.';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
        errors.email = 'Enter a valid email address.';
      }
      return errors;
    }

    function buildEnquiryEmail(p, data) {
      var subject = 'TradeFlow Enquiry — ' + p.planName + ' — ' + p.licenseType;

      var lines = [];
      lines.push('TRADEFLOW ERP — NEW CLIENT ENQUIRY');
      lines.push('--------------------------------------------------');
      lines.push('');
      lines.push('Client / Company: ' + data.company);
      lines.push('Contact Person: ' + data.contact);
      lines.push('Phone / WhatsApp: ' + data.phone);
      lines.push('Email: ' + data.email);
      lines.push('City: ' + (data.city || '-'));
      lines.push('');
      lines.push('SELECTED PACKAGE');
      lines.push('----------------');
      lines.push('Plan: ' + p.planName);
      lines.push('Licence: ' + p.licenseType);
      lines.push('Currency: ' + p.currency);
      if (p.licenseKey === 'perpetual') {
        lines.push('Purchase Price: ' + p.price);
        lines.push('');
        lines.push('3 months free Maintenance & Support included.');
        lines.push('After the initial 3-month period, optional Annual Maintenance & Support Contract (AMC) is available.');
      } else {
        lines.push('Setup Fee: ' + p.setupFee);
        lines.push('Monthly Subscription: ' + p.monthlyFee);
        lines.push('');
        lines.push('Maintenance, support and applicable updates continue while the subscription remains active.');
      }
      lines.push('');
      lines.push('CLIENT REQUIREMENTS');
      lines.push('-------------------');
      lines.push(data.message || '(none provided)');
      lines.push('');
      lines.push('Preferred Contact: ' + data.preferredContact);
      lines.push('');
      lines.push('--------------------------------------------------');
      lines.push('This enquiry was submitted from the TradeFlow ERP website.');
      lines.push('--------------------------------------------------');

      return { subject: subject, body: lines.join('\n') };
    }

    if (interestForm) {
      interestForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!activeInterestCard) return;

        var fd = new FormData(interestForm);
        var data = {
          company: String(fd.get('company') || ''),
          contact: String(fd.get('contact') || ''),
          phone: String(fd.get('phone') || ''),
          email: String(fd.get('email') || ''),
          city: String(fd.get('city') || ''),
          message: String(fd.get('message') || ''),
          preferredContact: String(fd.get('preferredContact') || 'WhatsApp')
        };

        var errors = validateInterestForm(data);
        $$('.form-field', interestForm).forEach(function (field) {
          var input = $('input, select, textarea', field);
          var errEl = $('.form-error', field);
          if (!input || !errEl) return;
          var name = input.name;
          if (errors[name]) {
            field.classList.add('has-error');
            errEl.textContent = errors[name];
          } else {
            field.classList.remove('has-error');
            errEl.textContent = '';
          }
        });
        if (Object.keys(errors).length) return;

        var p = getCurrentPricingState(activeInterestCard);
        var email = buildEnquiryEmail(p, data);
        var mailto = 'mailto:sabir1212@yahoo.com'
          + '?subject=' + encodeURIComponent(email.subject)
          + '&body=' + encodeURIComponent(email.body);

        window.location.href = mailto;

        $('#interestSuccessSummary').innerHTML = planSummaryHTML(p);
        $('#interestStepForm').hidden = true;
        $('#interestStepSuccess').hidden = false;
      });
    }

    /* ==================================================================
       11. "Print Agreement" flow
       ================================================================== */
    var agreementModal = $('#agreementModal');
    var agreementForm = $('#agreementForm');
    var activeAgreementCard = null;
    var pendingAgreementData = null;

    $$('.price-action-print', priceGrid).forEach(function (btn) {
      btn.addEventListener('click', function () {
        activeAgreementCard = btn.closest('.price');
        var p = getCurrentPricingState(activeAgreementCard);
        $('#agreementPlanSummary').innerHTML = planSummaryHTML(p);
        $('#agreementStepForm').hidden = false;
        $('#agreementStepPreview').hidden = true;
        agreementForm.reset();
        var dateInput = $('input[name="agreementDate"]', agreementForm);
        if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
        openModal(agreementModal);
      });
    });

    function nextAgreementNumber() {
      var year = new Date().getFullYear();
      var key = 'tf-agreement-seq-' + year;
      var seq = 1;
      try {
        seq = parseInt(localStorage.getItem(key), 10) || 0;
        seq += 1;
        localStorage.setItem(key, String(seq));
      } catch (e) { seq = 1; }
      return 'TF-' + year + '-' + String(seq).padStart(4, '0');
    }

    function formatAgreementDate(iso) {
      if (!iso) return new Date().toLocaleDateString('en-GB');
      var d = new Date(iso + 'T00:00:00');
      var dd = String(d.getDate()).padStart(2, '0');
      var mm = String(d.getMonth() + 1).padStart(2, '0');
      return dd + '/' + mm + '/' + d.getFullYear();
    }

    function buildAgreementDocument(p, client) {
      var agreementNo = nextAgreementNumber();
      var dateStr = formatAgreementDate(client.agreementDate);
      var field = function (v) { return v && v.trim() ? esc(v) : '____________________________'; };

      var modulesHTML = p.modules.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('');

      var licenceTermsHTML;
      var maintenanceHTML;
      var docSubtitle;

      if (p.licenseKey === 'perpetual') {
        docSubtitle = 'SOFTWARE PURCHASE &amp; PERPETUAL LICENCE AGREEMENT';
        licenceTermsHTML =
          '<div class="agr-row"><b>Plan:</b><span>' + esc(p.planName) + '</span></div>' +
          '<div class="agr-row"><b>Licence Type:</b><span>Perpetual Licence — One-Time Purchase</span></div>' +
          '<div class="agr-row"><b>Currency:</b><span>' + esc(p.currency) + '</span></div>' +
          '<div class="agr-row"><b>Purchase Price:</b><span>' + esc(p.price) + '</span></div>' +
          '<p>The Client is granted a perpetual, one-time-purchase licence to use the delivered TradeFlow software for its own business operations. The Client may use the software for its own business without recurring software licence fees. The Client may not resell, redistribute, publish or commercially distribute the TradeFlow software as a separate product without written permission from the Developer.</p>';
        maintenanceHTML =
          '<p>Three (3) months of Maintenance &amp; Support are included at no additional charge following successful delivery / go-live. This covers fixing genuine bugs in the delivered system, normal usage assistance, technical troubleshooting, minor configuration assistance and backup/restore guidance for the originally delivered functionality.</p>' +
          '<p>After the initial three-month period, continued Maintenance &amp; Support may be provided under an optional Annual Maintenance &amp; Support Contract (AMC), subject to the applicable AMC fee and terms. AMC renewal is not mandatory — if the Client does not renew AMC, the Client may continue using the delivered software under the licence terms, but ongoing support, maintenance and updates after the free period will not be provided unless AMC or another support arrangement is active.</p>' +
          '<p>For clarity, AMC does not automatically include new modules, new features, major customisation or new development. Such work — including new modules, new features, major workflow changes, custom reports, new/third-party integrations, device or biometric integrations, major database changes or custom business rules — requires separate requirement analysis and quotation.</p>';
      } else {
        docSubtitle = 'SOFTWARE SUBSCRIPTION AGREEMENT';
        licenceTermsHTML =
          '<div class="agr-row"><b>Plan:</b><span>' + esc(p.planName) + '</span></div>' +
          '<div class="agr-row"><b>Licence Type:</b><span>Subscription Licence</span></div>' +
          '<div class="agr-row"><b>Currency:</b><span>' + esc(p.currency) + '</span></div>' +
          '<div class="agr-row"><b>Setup Fee:</b><span>' + esc(p.setupFee) + '</span></div>' +
          '<div class="agr-row"><b>Monthly Subscription:</b><span>' + esc(p.monthlyFee) + '</span></div>' +
          '<p>The setup fee is payable for initial setup and deployment. The monthly subscription keeps the licence active. This is not a perpetual ownership/purchase licence, and source code is not delivered under the Subscription Licence. If subscription payments stop or the subscription is terminated, access and support will be handled according to the final agreement terms.</p>';
        maintenanceHTML =
          '<p>Maintenance, support and applicable updates remain available while the subscription remains active and paid. New modules, new features, major workflow changes and custom development remain separately chargeable, the same as under the Perpetual Licence.</p>';
      }

      return '' +
        '<div class="agr-doc">' +
          '<div class="agr-title">TRADEFLOW ERP</div>' +
          '<div class="agr-subtitle">' + docSubtitle + '</div>' +
          '<div class="agr-meta"><span>Agreement No: ' + agreementNo + '</span><span>Agreement Date: ' + dateStr + '</span></div>' +

          '<div class="agr-section-title">CLIENT INFORMATION</div>' +
          '<div class="agr-row"><b>Client / Company:</b><span>' + field(client.company) + '</span></div>' +
          '<div class="agr-row"><b>Contact Person:</b><span>' + field(client.contact) + '</span></div>' +
          '<div class="agr-row"><b>Address:</b><span>' + field(client.address) + '</span></div>' +
          '<div class="agr-row"><b>Phone:</b><span>' + field(client.phone) + '</span></div>' +
          '<div class="agr-row"><b>Email:</b><span>' + field(client.email) + '</span></div>' +
          '<div class="agr-row"><b>CNIC / NTN:</b><span>' + field(client.cnic) + '</span></div>' +
          (client.businessType && client.businessType.trim() ? '<div class="agr-row"><b>Business Type:</b><span>' + esc(client.businessType) + '</span></div>' : '') +

          '<div class="agr-section-title">1. SOFTWARE PACKAGE</div>' +
          licenceTermsHTML +

          '<div class="agr-section-title">2. INCLUDED MODULES</div>' +
          '<ul class="agr-list">' + modulesHTML + '</ul>' +

          '<div class="agr-section-title">3. IMPLEMENTATION &amp; DELIVERY</div>' +
          '<p>Installation/setup, basic configuration and initial training are provided according to the selected package. Data migration from an existing system, where applicable, is scoped separately based on the format of the Client\'s existing data.</p>' +

          '<div class="agr-section-title">4. MAINTENANCE &amp; SUPPORT</div>' +
          maintenanceHTML +

          '<div class="agr-section-title">5. BUG FIXES VS NEW DEVELOPMENT</div>' +
          '<p><b>Bug Fix:</b> correction of an existing agreed feature that does not work according to its documented requirements.</p>' +
          '<p><b>New Development:</b> a new feature, module, report, integration, workflow, business rule, or substantial modification. New Development is separately quoted and requires the Client\'s approval before work begins.</p>' +

          '<div class="agr-section-title">6. DATA &amp; BACKUP</div>' +
          '<p>The Client is responsible for maintaining appropriate backups unless a separate managed backup service is agreed. All business data entered or generated by the Client through TradeFlow belongs to the Client.</p>' +

          '<div class="agr-section-title">7. THIRD-PARTY SERVICES</div>' +
          '<p>Hosting, SMS, email services, payment gateways, biometric devices, cloud services, domain names and other third-party services are not automatically included unless explicitly stated.</p>' +

          '<div class="agr-section-title">8. CLIENT RESPONSIBILITIES</div>' +
          '<p>The Client will provide required business information, accurate master data, required migration data, access to required systems/devices, a responsible contact person, and timely feedback and approvals.</p>' +

          '<div class="agr-section-title">9. PAYMENT TERMS</div>' +
          '<div class="agr-row"><b>Total Amount:</b><span>____________________________</span></div>' +
          '<div class="agr-row"><b>Amount Paid:</b><span>____________________________</span></div>' +
          '<div class="agr-row"><b>Remaining Amount:</b><span>____________________________</span></div>' +
          '<div class="agr-row"><b>Payment Method:</b><span>____________________________</span></div>' +

          '<div class="agr-section-title">10. ACCEPTANCE</div>' +
          '<p>By signing below, the Client confirms that the selected package, licence type, price and included functionality described above have been reviewed and accepted.</p>' +

          '<div class="agr-section-title">SIGNATURES</div>' +
          '<table class="agr-sig-table"><tbody>' +
            '<tr>' +
              '<td><b>CLIENT</b><br><br>Name: ____________________<br><br>Signature: ____________________<br><br>Date: ____________________</td>' +
              '<td><b>DEVELOPER / SERVICE PROVIDER</b><br><br>Sabir Shah<br><br>Signature: ____________________<br><br>Date: ____________________</td>' +
              '<td><b>WITNESS 1</b><br><br>Name: ____________________<br><br>CNIC: ____________________<br><br>Signature: ____________________</td>' +
              '<td><b>WITNESS 2</b><br><br>Name: ____________________<br><br>CNIC: ____________________<br><br>Signature: ____________________</td>' +
            '</tr>' +
          '</tbody></table>' +

          '<div class="agr-footer-note">This document is a commercial software licence and service agreement template. Specific legal, tax or regulatory requirements should be reviewed according to the applicable jurisdiction. The agreement number above is an internal reference number, not an officially registered legal document number.</div>' +
        '</div>';
    }

    if (agreementForm) {
      agreementForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!activeAgreementCard) return;

        var fd = new FormData(agreementForm);
        var client = {
          company: String(fd.get('company') || ''),
          contact: String(fd.get('contact') || ''),
          address: String(fd.get('address') || ''),
          phone: String(fd.get('phone') || ''),
          email: String(fd.get('email') || ''),
          cnic: String(fd.get('cnic') || ''),
          businessType: String(fd.get('businessType') || ''),
          agreementDate: String(fd.get('agreementDate') || '')
        };

        var p = getCurrentPricingState(activeAgreementCard);
        pendingAgreementData = { p: p, client: client };

        $('#agreementPreviewSummary').innerHTML = planSummaryHTML(p) +
          '<div class="msum-row"><span>Free Maintenance &amp; Support</span><b>' +
          (p.licenseKey === 'perpetual' ? '3 Months' : 'While subscription is active') + '</b></div>' +
          (p.licenseKey === 'perpetual'
            ? '<div class="msum-row"><span>After Free Period</span><b>Optional Annual Maintenance &amp; Support Contract</b></div>'
            : '');

        $('#agreementStepForm').hidden = true;
        $('#agreementStepPreview').hidden = false;
      });
    }

    var agreementBackBtn = $('#agreementBackBtn');
    if (agreementBackBtn) {
      agreementBackBtn.addEventListener('click', function () {
        $('#agreementStepForm').hidden = false;
        $('#agreementStepPreview').hidden = true;
      });
    }

    var agreementPrintBtn = $('#agreementPrintBtn');
    if (agreementPrintBtn) {
      agreementPrintBtn.addEventListener('click', function () {
        if (!pendingAgreementData) return;
        var docHTML = buildAgreementDocument(pendingAgreementData.p, pendingAgreementData.client);
        $('#agreementPrintArea').innerHTML = docHTML;
        closeModal(agreementModal);
        setTimeout(function () { window.print(); }, 50);
      });
    }
  }
})();
