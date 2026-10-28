/* ============================================================
   billing-gate.js — CleanPro TX
   Al abrir el dashboard revisa que la cuenta tenga suscripcion
   en Stripe (prueba de 14 dias con tarjeta, o activa).
   Si no, muestra una pantalla para poner la tarjeta.
   Se agrega en dashboard.html con:
     <script src="billing-gate.js"></script>
   ============================================================ */
(function () {
  var SUPABASE_URL = 'https://yfqoncqoerleoaqxvaie.supabase.co';
  var FN = SUPABASE_URL + '/functions/v1/billing';
  var STORAGE_KEY = 'sb-yfqoncqoerleoaqxvaie-auth-token';
  var PLANS = [
    { id: 'Basic', price: 29 },
    { id: 'Pro', price: 59, popular: true },
    { id: 'Enterprise', price: 129 }
  ];

  var params = new URLSearchParams(location.search);
  var returningFromStripe = params.has('session_id');

  // ---------- Pantalla ----------
  var css = '' +
    '#cpg{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;' +
    'background:linear-gradient(160deg,#1e1b4b,#312e81 55%,#0f766e);font-family:inherit;color:#fff;}' +
    '#cpg .box{width:100%;max-width:440px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);' +
    'border-radius:18px;padding:28px 22px;text-align:center;backdrop-filter:blur(8px);}' +
    '#cpg h2{margin:0 0 8px;font-size:24px;}#cpg p{margin:0 0 18px;color:#dbeafe;font-size:14px;line-height:1.5;}' +
    '#cpg .plans{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:18px;}' +
    '#cpg .plan{border:1.5px solid rgba(255,255,255,.25);border-radius:12px;padding:12px 4px;cursor:pointer;background:transparent;color:#fff;}' +
    '#cpg .plan.sel{border-color:#5eead4;background:rgba(94,234,212,.12);}' +
    '#cpg .plan b{display:block;font-size:13px;}#cpg .plan span{font-size:20px;font-weight:700;}#cpg .plan small{display:block;font-size:10px;opacity:.7;}' +
    '#cpg .go{width:100%;padding:14px;border:0;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;' +
    'background:linear-gradient(90deg,#5eead4,#38bdf8);color:#0f172a;}#cpg .go:disabled{opacity:.6;cursor:wait;}' +
    '#cpg .fine{margin-top:12px;font-size:12px;color:#c7d2fe;}#cpg .out{margin-top:16px;background:none;border:0;color:#a5b4fc;text-decoration:underline;cursor:pointer;font-size:12px;}' +
    '#cpg .err{color:#fca5a5;font-size:12px;margin-top:10px;min-height:16px;}';
  var style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  var root = document.createElement('div'); root.id = 'cpg';
  root.innerHTML = '<div class="box"><p>Checking your subscription…</p></div>';
  function mount() { if (!document.getElementById('cpg')) document.body.appendChild(root); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
  function close() { root.remove(); }

  // ---------- Sesion ----------
  async function getToken() {
    try {
      if (window.sb && sb.auth && sb.auth.getSession) {
        var r = await sb.auth.getSession();
        if (r && r.data && r.data.session) return r.data.session.access_token;
      }
    } catch (e) {}
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { var s = JSON.parse(raw); return s.access_token || (s.currentSession && s.currentSession.access_token); }
    } catch (e) {}
    return null;
  }

  async function call(action, extra) {
    var token = await getToken();
    if (!token) return { noSession: true };
    var res = await fetch(FN, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ action: action }, extra || {}))
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok && !('allowed' in data)) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  }

  // ---------- Pantalla para pagar ----------
  function showPaywall(st) {
    var past = st.status === 'past_due';
    var hadSub = st.has_subscription;
    var chosen = st.plan && PLANS.some(function (p) { return p.id === st.plan; }) ? st.plan : 'Pro';
    var title, text, btn;
    if (past) {
      title = 'Payment failed';
      text = 'We could not charge your card. Update your payment method to keep using CleanPro TX.';
      btn = 'Update payment method';
    } else if (hadSub) {
      title = 'Your subscription ended';
      text = 'Choose a plan to reactivate your CleanPro TX dashboard. Your data is safe.';
      btn = 'Reactivate';
    } else {
      title = 'Start your 14-day free trial';
      text = 'Add a card to unlock your dashboard. You will not be charged until day 15, and you can cancel anytime before that.';
      btn = 'Add card & start free trial';
    }
    var plansHtml = past ? '' : '<div class="plans">' + PLANS.map(function (p) {
      return '<button type="button" class="plan' + (p.id === chosen ? ' sel' : '') + '" data-plan="' + p.id + '">' +
        '<b>' + p.id + '</b><span>$' + p.price + '</span><small>/month' + (p.popular ? ' · popular' : '') + '</small></button>';
    }).join('') + '</div>';
    var fine = past ? '' : (hadSub ? 'Billed monthly. Cancel anytime.' :
      '14 days free, then the plan price per month. Cancel anytime before day 15 and you will not be charged.');

    root.innerHTML = '<div class="box"><h2>' + title + '</h2><p>' + text + '</p>' + plansHtml +
      '<button class="go" type="button">' + btn + '</button>' +
      (fine ? '<div class="fine">' + fine + '</div>' : '') +
      '<div class="err"></div><button class="out" type="button">Sign out</button></div>';

    root.querySelectorAll('.plan').forEach(function (b) {
      b.onclick = function () {
        chosen = b.getAttribute('data-plan');
        root.querySelectorAll('.plan').forEach(function (x) { x.classList.toggle('sel', x === b); });
      };
    });
    var go = root.querySelector('.go');
    go.onclick = async function () {
      go.disabled = true; go.textContent = 'Opening secure checkout…';
      try {
        var r = await call(past ? 'portal' : 'checkout', { plan: chosen });
        if (r.url) { location.href = r.url; return; }
        throw new Error(r.error || 'Could not open checkout');
      } catch (e) {
        root.querySelector('.err').textContent = e.message + '. Please try again.';
        go.disabled = false; go.textContent = btn;
      }
    };
    root.querySelector('.out').onclick = async function () {
      try { if (window.sb) await sb.auth.signOut(); } catch (e) {}
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
      location.reload();
    };
  }

  // ---------- Revisar ----------
  async function check(attempt) {
    try {
      var st = await call('status');
      if (st.noSession) { close(); return; }   // el dashboard ya manda al login
      if (st.allowed) {
        close();
        if (returningFromStripe) history.replaceState(null, '', location.pathname);
        return;
      }
      // Recien pago: Stripe tarda unos segundos en avisar
      if (returningFromStripe && attempt < 8) {
        root.innerHTML = '<div class="box"><p>Activating your account…</p></div>';
        return setTimeout(function () { check(attempt + 1); }, 2000);
      }
      showPaywall(st);
    } catch (e) {
      console.warn('billing-gate:', e.message);
      close(); // si falla la revision, no bloquear a quien ya paga
    }
  }

  // Esperar a que el dashboard cargue su sesion
  window.addEventListener('load', function () { setTimeout(function () { check(0); }, 300); });
})();
