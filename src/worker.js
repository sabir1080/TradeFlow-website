/* ==========================================================================
   TradeFlow ERP — Feedback API + Admin dashboard Worker
   ==========================================================================
   Runs for every request (see wrangler.jsonc "main"). Handles:
     POST /api/feedback           - public, stores one feedback record
     GET  /admin                  - password-gated dashboard (HTML)
     GET  /api/admin/feedback     - password-gated stats JSON
     GET  /api/admin/comments     - password-gated comment list JSON
   Everything else falls through to env.ASSETS.fetch(request), so the
   existing static site is served completely unchanged.

   Requires (set once by the site owner, not stored in this repo):
     - D1 database bound as "DB" (see wrangler.jsonc d1_databases)
     - Worker secret ADMIN_PASSWORD (wrangler secret put ADMIN_PASSWORD)
     - Optional Worker var ADMIN_USERNAME (defaults to "admin")
   ========================================================================== */

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 5;
const MAX_COMMENT_LEN = 2000;
const MAX_EMAIL_LEN = 254;
const MAX_PAGE_LEN = 300;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function checkAdminAuth(request, env) {
  const header = request.headers.get('Authorization') || '';
  if (!header.startsWith('Basic ')) return false;
  let decoded;
  try { decoded = atob(header.slice(6)); } catch (e) { return false; }
  const sep = decoded.indexOf(':');
  if (sep === -1) return false;
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);
  const expectedUser = env.ADMIN_USERNAME || 'admin';
  const expectedPass = env.ADMIN_PASSWORD || '';
  if (!expectedPass) return false; // ADMIN_PASSWORD not configured yet - deny, never default-open
  return timingSafeEqual(user, expectedUser) && timingSafeEqual(pass, expectedPass);
}

function unauthorized() {
  return new Response('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="TradeFlow Admin"', 'content-type': 'text/plain' }
  });
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function sameOriginOk(request, url) {
  const origin = request.headers.get('Origin');
  if (origin) {
    try { return new URL(origin).host === url.host; } catch (e) { return false; }
  }
  const referer = request.headers.get('Referer');
  if (referer) {
    try { return new URL(referer).host === url.host; } catch (e) { return false; }
  }
  return true; // no Origin/Referer sent at all - fall back to rate-limit + honeypot
}

/* ------------------------------------------------------------------
   POST /api/feedback
   ------------------------------------------------------------------ */
async function handleSubmit(request, env, url) {
  if (!sameOriginOk(request, url)) return json({ error: 'Invalid origin.' }, 403);

  let body;
  try { body = await request.json(); } catch (e) { return json({ error: 'Invalid request body.' }, 400); }

  // Honeypot: real visitors never fill this hidden field. Bots that do get
  // a fake success so they don't learn the field is a trap.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return json({ ok: true });
  }

  const response = String(body.response || '').toLowerCase();
  if (response !== 'yes' && response !== 'no') {
    return json({ error: 'response must be "yes" or "no".' }, 400);
  }

  let comment = typeof body.comment === 'string' ? body.comment.trim() : '';
  if (comment.length > MAX_COMMENT_LEN) comment = comment.slice(0, MAX_COMMENT_LEN);

  let email = typeof body.email === 'string' ? body.email.trim() : '';
  if (email) {
    if (email.length > MAX_EMAIL_LEN || !EMAIL_RE.test(email)) {
      return json({ error: 'Enter a valid email address, or leave it blank.' }, 400);
    }
  }

  let page = typeof body.page === 'string' ? body.page.trim() : '';
  if (!page) page = url.pathname;
  if (page.length > MAX_PAGE_LEN) page = page.slice(0, MAX_PAGE_LEN);

  const ip = request.headers.get('CF-Connecting-IP') || '';
  const ipHash = ip ? await sha256Hex(ip) : null;
  const userAgent = (request.headers.get('User-Agent') || '').slice(0, 300);
  const createdAt = new Date().toISOString();

  if (ipHash) {
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const recent = await env.DB.prepare(
      'SELECT COUNT(*) AS cnt FROM feedback WHERE ip_hash = ? AND created_at > ?'
    ).bind(ipHash, windowStart).first();
    if (recent && recent.cnt >= RATE_LIMIT_MAX) {
      return json({ error: 'Too many submissions. Please try again in a minute.' }, 429);
    }
  }

  await env.DB.prepare(
    'INSERT INTO feedback (response, comment, email, page, ip_hash, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(response, comment || null, email || null, page, ipHash, userAgent, createdAt).run();

  return json({ ok: true });
}

/* ------------------------------------------------------------------
   Shared filter parsing for the admin endpoints.
   ------------------------------------------------------------------ */
function buildFilters(url) {
  const clauses = [];
  const params = [];

  const date = url.searchParams.get('date');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const page = url.searchParams.get('page');
  const resp = url.searchParams.get('response');
  const hasEmail = url.searchParams.get('hasEmail');

  if (date) {
    clauses.push('created_at LIKE ?');
    params.push(date + '%');
  } else if (from || to) {
    if (from) { clauses.push('created_at >= ?'); params.push(from + 'T00:00:00.000Z'); }
    if (to) { clauses.push('created_at <= ?'); params.push(to + 'T23:59:59.999Z'); }
  }

  if (page) { clauses.push('page = ?'); params.push(page); }

  if (resp === 'yes' || resp === 'no') { clauses.push('response = ?'); params.push(resp); }

  if (hasEmail === 'true') clauses.push("email IS NOT NULL AND TRIM(email) != ''");
  else if (hasEmail === 'false') clauses.push("(email IS NULL OR TRIM(email) = '')");

  return { where: clauses.length ? 'WHERE ' + clauses.join(' AND ') : '', params };
}

/* ------------------------------------------------------------------
   GET /api/admin/feedback - aggregated stats (computed from the raw
   per-submission records, never from a separately stored total).
   ------------------------------------------------------------------ */
async function handleAdminStats(request, env, url) {
  const { where, params } = buildFilters(url);
  const sql = `
    SELECT
      SUM(CASE WHEN response = 'yes' THEN 1 ELSE 0 END) AS totalYes,
      SUM(CASE WHEN response = 'no' THEN 1 ELSE 0 END) AS totalNo,
      SUM(CASE WHEN comment IS NOT NULL AND TRIM(comment) != '' THEN 1 ELSE 0 END) AS totalComments,
      COUNT(*) AS totalSubmissions
    FROM feedback ${where}
  `;
  const row = await env.DB.prepare(sql).bind(...params).first();
  return json({
    totalYes: row?.totalYes || 0,
    totalNo: row?.totalNo || 0,
    totalComments: row?.totalComments || 0,
    totalSubmissions: row?.totalSubmissions || 0
  });
}

/* ------------------------------------------------------------------
   GET /api/admin/comments - individual comment records, newest first.
   ------------------------------------------------------------------ */
async function handleAdminComments(request, env, url) {
  const { where, params } = buildFilters(url);
  const commentClause = where
    ? where + " AND comment IS NOT NULL AND TRIM(comment) != ''"
    : "WHERE comment IS NOT NULL AND TRIM(comment) != ''";
  const sql = `
    SELECT id, response, comment, email, page, created_at
    FROM feedback ${commentClause}
    ORDER BY created_at DESC
    LIMIT 500
  `;
  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return json({ comments: results || [] });
}

/* ------------------------------------------------------------------
   GET /admin - dashboard shell (data loaded client-side via the two
   endpoints above, using the same Basic Auth credentials).
   ------------------------------------------------------------------ */
function adminPageHtml() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>TradeFlow Feedback — Admin</title>
<style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Inter,sans-serif;background:#060a13;color:#e7edf7}
  .wrap{max-width:960px;margin:0 auto;padding:28px 20px 60px}
  h1{font-size:20px;margin:0 0 4px}
  p.sub{color:#8ea0bd;margin:0 0 24px;font-size:13px}
  .filters{display:flex;gap:10px;flex-wrap:wrap;align-items:end;background:#0e1626;border:1px solid #1c2a44;border-radius:12px;padding:16px;margin-bottom:22px}
  .filters label{display:flex;flex-direction:column;gap:5px;font-size:12px;color:#a5b3c9}
  .filters input,.filters select{background:#0a1120;border:1px solid #22314f;border-radius:8px;color:#e7edf7;padding:8px 10px;font:inherit}
  .filters button{background:linear-gradient(120deg,#38c6ff,#0b6bff);border:none;color:#fff;font-weight:600;border-radius:8px;padding:9px 16px;cursor:pointer;font:inherit}
  .filters button:hover{opacity:.9}
  .filters .clear{background:transparent;border:1px solid #22314f;color:#a5b3c9}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin-bottom:26px}
  .stat{background:#0e1626;border:1px solid #1c2a44;border-radius:12px;padding:16px}
  .stat strong{display:block;font-size:26px}
  .stat span{font-size:12px;color:#8ea0bd}
  h2{font-size:15px;margin:0 0 12px}
  .comment{background:#0e1626;border:1px solid #1c2a44;border-radius:10px;padding:14px 16px;margin-bottom:10px}
  .comment p{margin:0 0 8px;font-size:14px;white-space:pre-wrap;word-break:break-word}
  .comment .meta{display:flex;gap:12px;flex-wrap:wrap;font-size:11.5px;color:#8ea0bd}
  .comment .tag{padding:2px 8px;border-radius:99px;font-weight:600}
  .tag.yes{background:rgba(37,201,143,.15);color:#25c98f}
  .tag.no{background:rgba(255,90,90,.15);color:#ff5a5a}
  .empty{color:#8ea0bd;font-size:13px;padding:20px 0}
  .loading{color:#8ea0bd;font-size:13px}
</style>
</head>
<body>
<div class="wrap">
  <h1>TradeFlow Feedback — Admin</h1>
  <p class="sub">Individual submission records. Not visible anywhere on the public site.</p>

  <form class="filters" id="filterForm">
    <label>Date <input type="date" name="date"></label>
    <label>From <input type="date" name="from"></label>
    <label>To <input type="date" name="to"></label>
    <label>Page/URL <input type="text" name="page" placeholder="/ or #pricing"></label>
    <label>Response
      <select name="response"><option value="">All</option><option value="yes">Yes</option><option value="no">No</option></select>
    </label>
    <label>Email
      <select name="hasEmail"><option value="">All</option><option value="true">Provided</option><option value="false">Not provided</option></select>
    </label>
    <button type="submit">Apply filters</button>
    <button type="button" class="clear" id="clearBtn">Clear</button>
  </form>

  <div class="stats" id="stats"><div class="loading">Loading…</div></div>

  <h2 id="commentsHeading">Comments</h2>
  <div id="comments"><div class="loading">Loading…</div></div>
</div>

<script>
  function qs(obj) {
    var p = new URLSearchParams();
    Object.keys(obj).forEach(function (k) { if (obj[k]) p.set(k, obj[k]); });
    return p.toString();
  }
  function currentFilters() {
    var fd = new FormData(document.getElementById('filterForm'));
    return { date: fd.get('date') || '', from: fd.get('from') || '', to: fd.get('to') || '',
             page: fd.get('page') || '', response: fd.get('response') || '', hasEmail: fd.get('hasEmail') || '' };
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function renderStats(s) {
    document.getElementById('stats').innerHTML =
      '<div class="stat"><strong>' + s.totalYes + '</strong><span>Total Yes</span></div>' +
      '<div class="stat"><strong>' + s.totalNo + '</strong><span>Total No</span></div>' +
      '<div class="stat"><strong>' + s.totalComments + '</strong><span>Total Comments</span></div>' +
      '<div class="stat"><strong>' + s.totalSubmissions + '</strong><span>Total Submissions</span></div>';
  }
  function renderComments(list) {
    document.getElementById('commentsHeading').textContent = 'Comments (' + list.length + ')';
    var el = document.getElementById('comments');
    if (!list.length) { el.innerHTML = '<div class="empty">No comments match these filters.</div>'; return; }
    el.innerHTML = list.map(function (c) {
      var dt = new Date(c.created_at);
      var dtStr = isNaN(dt) ? c.created_at : dt.toLocaleString();
      return '<div class="comment">' +
        '<p>' + escapeHtml(c.comment) + '</p>' +
        '<div class="meta">' +
          '<span class="tag ' + (c.response === 'yes' ? 'yes' : 'no') + '">' + (c.response === 'yes' ? 'Yes' : 'No') + '</span>' +
          '<span>' + escapeHtml(dtStr) + '</span>' +
          '<span>' + escapeHtml(c.page) + '</span>' +
          (c.email ? '<span>' + escapeHtml(c.email) + '</span>' : '<span>No email</span>') +
        '</div>' +
      '</div>';
    }).join('');
  }
  function load() {
    var f = currentFilters();
    var query = qs(f);
    fetch('/api/admin/feedback?' + query).then(function (r) { return r.json(); }).then(renderStats);
    fetch('/api/admin/comments?' + query).then(function (r) { return r.json(); }).then(function (d) { renderComments(d.comments || []); });
  }
  document.getElementById('filterForm').addEventListener('submit', function (e) { e.preventDefault(); load(); });
  document.getElementById('clearBtn').addEventListener('click', function () { document.getElementById('filterForm').reset(); load(); });
  load();
</script>
</body>
</html>`;
}

/* ------------------------------------------------------------------
   Entry point
   ------------------------------------------------------------------ */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/api/feedback') {
      try {
        return await handleSubmit(request, env, url);
      } catch (e) {
        return json({ error: 'Something went wrong. Please try again.' }, 500);
      }
    }

    if (url.pathname === '/admin') {
      if (!checkAdminAuth(request, env)) return unauthorized();
      return new Response(adminPageHtml(), { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } });
    }

    if (url.pathname === '/api/admin/feedback') {
      if (!checkAdminAuth(request, env)) return unauthorized();
      return handleAdminStats(request, env, url);
    }

    if (url.pathname === '/api/admin/comments') {
      if (!checkAdminAuth(request, env)) return unauthorized();
      return handleAdminComments(request, env, url);
    }

    return env.ASSETS.fetch(request);
  }
};
