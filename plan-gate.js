/* ============================================================
   plan-gate.js — CleanPro TX
   Bloquea las secciones del dashboard segun el plan del negocio
   (businesses.plan = Basic | Pro | Enterprise).
   - En el menu: las secciones que el plan no incluye salen con
     candado y la etiqueta del plan que las desbloquea.
   - Al darles clic: en vez de abrir la seccion, sale una pantalla
     de "Upgrade" (no se cargan los datos de esa seccion).
   Se agrega en dashboard.html DESPUES de p1.js ... p5.js:
     <script src="plan-gate.js"></script>
   Para cambiar que incluye cada plan, edita SECTION_PLAN abajo.
   ============================================================ */
(function () {
  var RANK = { Basic: 1, Pro: 2, Enterprise: 3 };

  // Plan minimo para cada seccion. Lo que no aparece aqui = Basic.
  var SECTION_PLAN = {
    acct: 'Pro',            // Accounting (P&L completo)
    marketing: 'Pro',       // SMS / WhatsApp automation
    apps: 'Pro',            // Integraciones
    timesheets: 'Enterprise', // Timesheets & payroll
    finance: 'Enterprise'     // Business Finance
  };

  var TITLES = {
    acct: 'Accounting', marketing: 'Marketing', apps: 'Apps',
    timesheets: 'Timesheets', finance: 'Business Finance'
  };
  var PITCH = {
    acct: 'Full profit & loss, tax categories and year-end numbers ready for your accountant.',
    marketing: 'Automatic SMS & WhatsApp follow-ups, review requests and campaigns to past clients.',
    apps: 'Connect CleanPro TX with the tools you already use.',
    timesheets: 'Clock-in / clock-out for your team, hours per job and payroll totals.',
    finance: 'Bank accounts, statement upload, real profit, owner draws and a debt-free plan.'
  };

  function currentPlan() {
    var p = (window._biz && window._biz.plan) || 'Basic';
    return RANK[p] ? p : 'Basic';
  }
  function needed(id) { return SECTION_PLAN[id] || 'Basic'; }
  function allowed(id) { return RANK[currentPlan()] >= RANK[needed(id)]; }
  window.planAllows = allowed;

  // ---------- Estilos ----------
  var css = '' +
    '.ni.pg-locked,#mobile-nav .pg-locked{opacity:.55;}' +
    '.pg-tag{margin-left:auto;font-size:9px;font-weight:700;color:#fff;padding:1px 6px;border-radius:99px;letter-spacing:.03em;white-space:nowrap;}' +
    '.pg-tag.pro{background:#6366F1;}.pg-tag.enterprise{background:#F59E0B;}' +
    '#mobile-nav .pg-lockicon{position:absolute;top:3px;right:8px;font-size:9px;}' +
    '#s-locked .pg-card{max-width:560px;margin:40px auto;padding:36px 28px;text-align:center;}' +
    '#s-locked .pg-badge{display:inline-block;font-size:11px;font-weight:700;padding:4px 10px;border-radius:99px;letter-spacing:.05em;color:#fff;}' +
    '#s-locked h2{font-size:22px;margin:14px 0 8px;}#s-locked p{color:var(--tx2);margin:0 0 22px;line-height:1.5;}' +
    '#s-locked .pg-now{font-size:12px;color:var(--tx3);margin-top:12px;}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- Pantalla de upgrade ----------
  function lockedSection() {
    var s = document.getElementById('s-locked');
    if (s) return s;
    var ref = document.getElementById('s-schedule');
    if (!ref) return null;
    s = document.createElement('div');
    s.className = 'sec'; s.id = 's-locked';
    ref.parentNode.appendChild(s);
    return s;
  }
  function esc(x) { return String(x == null ? '' : x).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function showLocked(id, el) {
    var s = lockedSection(); if (!s) return;
    var plan = needed(id);
    var color = plan === 'Enterprise' ? '#F59E0B' : '#6366F1';
    s.innerHTML = '<div class="card pg-card">' +
      '<div class="pg-badge" style="background:' + color + '">🔒 ' + plan.toUpperCase() + '</div>' +
      '<h2>' + esc(TITLES[id] || id) + '</h2>' +
      '<p>' + esc(PITCH[id] || '') + '<br>Available on the ' + plan + ' plan' + (plan === 'Pro' ? ' and up' : '') + '.</p>' +
      '<button class="btn btn-primary" onclick="openBillingPortal(this)">Upgrade to ' + plan + '</button>' +
      '<div class="pg-now">Your current plan: ' + esc(currentPlan()) + '</div>' +
      '</div>';
    document.querySelectorAll('.sec').forEach(function (x) { x.classList.remove('on'); });
    document.querySelectorAll('.ni').forEach(function (n) { n.classList.remove('on'); });
    s.classList.add('on');
    if (el) el.classList.add('on');
    try { document.getElementById('ptitle').textContent = TITLES[id] || id; } catch (e) {}
    window._cur = id;
  }

  // ---------- Envolver nav() ----------
  var origNav = window.nav;
  if (typeof origNav !== 'function') { console.warn('plan-gate: nav() not found'); return; }
  window.nav = function (id, el) {
    if (window._biz) {
      if (!allowed(id)) return showLocked(id, el);
      return origNav(id, el);
    }
    // Todavia no carga el negocio: esperar y luego decidir
    getBizId().then(function () {
      if (!allowed(id)) showLocked(id, el); else origNav(id, el);
    });
  };

  // ---------- Marcar el menu ----------
  function idFromEl(el) {
    var m = (el.getAttribute('onclick') || '').match(/nav\('([a-z]+)'/);
    return m ? m[1] : null;
  }
  function decorate() {
    // Sidebar
    document.querySelectorAll('.ni').forEach(function (el) {
      var id = idFromEl(el); if (!id) return;
      var old = el.querySelector('.pg-tag'); if (old) old.remove();
      var locked = !allowed(id);
      el.classList.toggle('pg-locked', locked);
      if (locked) {
        var plan = needed(id);
        var t = document.createElement('span');
        t.className = 'pg-tag ' + plan.toLowerCase();
        t.textContent = '🔒 ' + plan.toUpperCase();
        el.appendChild(t);
      }
    });
    // Barra de abajo (celular)
    document.querySelectorAll('#mobile-nav > div').forEach(function (el) {
      var id = idFromEl(el); if (!id) return;
      var old = el.querySelector('.pg-lockicon'); if (old) old.remove();
      var locked = !allowed(id);
      el.classList.toggle('pg-locked', locked);
      if (locked) {
        el.style.position = 'relative';
        var i = document.createElement('span'); i.className = 'pg-lockicon'; i.textContent = '🔒';
        el.appendChild(i);
      }
    });
  }

  function init() {
    if (typeof getBizId !== 'function') return;
    getBizId().then(decorate).catch(function (e) { console.warn('plan-gate:', e); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
