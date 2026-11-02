/* ============================================================
   ai-marketing.js — Creador de posts con IA
   Se usa en el Dashboard de The Best Cleaning y en CleanPro TX.

   Cada app lo configura ANTES de cargar este archivo:
     window.AIMKT_CONFIG = {
       getToken:  async () => 'jwt de la sesion',
       business:  () => ({ name, phone, city, website }),
       recentPhotos: async () => [{ url, label }],   // opcional
       mountId: 's-marketing'                         // seccion donde va
     };

   Flujo: subes fotos o videos (o eliges de trabajos recientes) ->
   la IA escribe el post para la red que elijas -> lo copias,
   descargas la imagen Antes/Despues o lo compartes desde el celular.
   La IA NO publica sola: tu revisas y publicas.
   ============================================================ */
(function () {
  var FN = 'https://kpahdvgwpeyggilujzsd.supabase.co/functions/v1/ai-marketing';
  var MAX = 8;
  var C = window.AIMKT_CONFIG || {};
  var S = { items: [], result: null, busy: false };

  function $(id) { return document.getElementById(id); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function note(msg, bad) {
    var el = $('aim-msg'); if (!el) return;
    el.textContent = msg || ''; el.style.color = bad ? 'var(--red,#EF4444)' : 'var(--tx3,#888)';
  }

  // ---------- Estilos ----------
  var css = '' +
    '#aim .aim-drop{border:2px dashed var(--border,#ddd);border-radius:12px;padding:22px;text-align:center;cursor:pointer;color:var(--tx2,#555);font-size:13px;}' +
    '#aim .aim-drop:hover{border-color:var(--purple,#7C3AED);}' +
    '#aim .aim-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;margin-top:12px;}' +
    '#aim .aim-th{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;background:#eee;}' +
    '#aim .aim-th img{width:100%;height:100%;object-fit:cover;display:block;}' +
    '#aim .aim-th .x{position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;border:0;background:rgba(0,0,0,.6);color:#fff;cursor:pointer;font-size:13px;line-height:22px;padding:0;}' +
    '#aim .aim-th .tag{position:absolute;left:4px;bottom:4px;font-size:10px;font-weight:700;background:rgba(0,0,0,.6);color:#fff;padding:2px 6px;border-radius:99px;}' +
    '#aim .aim-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-top:14px;}' +
    '#aim .aim-out{white-space:pre-wrap;background:var(--border2,#f6f6f6);border-radius:10px;padding:14px;font-size:13px;line-height:1.55;color:var(--tx,#222);}' +
    '#aim .aim-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px;}' +
    '#aim canvas{max-width:min(100%,440px);border-radius:10px;margin-top:10px;display:block;}' +
    '#aim .aim-pick{display:none;margin-top:12px;}' +
    '#aim .aim-pick .aim-th{cursor:pointer;}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ---------- Pantalla ----------
  function mount() {
    var sec = $(C.mountId || 's-marketing');
    if (!sec || $('aim')) return;
    var card = document.createElement('div');
    card.className = 'card'; card.id = 'aim'; card.style.marginBottom = '18px';
    card.innerHTML =
      '<div class="card-header"><div class="card-title">✨ AI Post Creator</div>' +
      '<div style="font-size:11px;color:var(--tx3);">Upload job photos or videos — AI writes the post, you publish it</div></div>' +
      '<div style="padding:16px;">' +
        '<div class="aim-drop" id="aim-drop">📷 🎥 <b>Tap to add photos or videos</b><br><span style="font-size:11px;">Before & after photos work best · up to ' + MAX + '</span></div>' +
        '<input type="file" id="aim-file" accept="image/*,video/*" multiple style="display:none"/>' +
        (C.recentPhotos ? '<div style="margin-top:8px;"><button type="button" class="btn btn-outline btn-sm" id="aim-recent">🖼️ Pick from recent jobs</button></div><div class="aim-pick" id="aim-pick"></div>' : '') +
        '<div class="aim-grid" id="aim-grid"></div>' +
        '<div class="aim-row">' +
          '<div><label class="form-label">Post for</label><select class="form-input" id="aim-plat">' +
            '<option value="facebook">Facebook</option><option value="instagram">Instagram</option>' +
            '<option value="google">Google Business</option><option value="nextdoor">Nextdoor</option>' +
            '<option value="tiktok">TikTok / Reels</option></select></div>' +
          '<div><label class="form-label">Language</label><select class="form-input" id="aim-lang">' +
            '<option value="en">English</option><option value="es">Español</option><option value="both">English + Español</option></select></div>' +
        '</div>' +
        '<div style="margin-top:10px;"><label class="form-label">Notes for the AI (optional)</label>' +
          '<input class="form-input" id="aim-notes" placeholder="e.g. move-out deep clean, 3 bedrooms, took 5 hours"/></div>' +
        '<div class="aim-btns"><button type="button" class="btn btn-primary" id="aim-go">✨ Create post</button></div>' +
        '<div id="aim-msg" style="font-size:12px;margin-top:8px;min-height:16px;"></div>' +
        '<div id="aim-res"></div>' +
      '</div>';
    sec.insertBefore(card, sec.children[1] || null);

    $('aim-drop').onclick = function () { $('aim-file').click(); };
    $('aim-file').onchange = function (e) { addFiles(e.target.files); e.target.value = ''; };
    $('aim-go').onclick = generate;
    if (C.recentPhotos) $('aim-recent').onclick = toggleRecent;
    render();
  }

  // ---------- Fotos y videos ----------
  function loadImg(src) {
    return new Promise(function (ok, bad) {
      var im = new Image(); im.crossOrigin = 'anonymous';
      im.onload = function () { ok(im); }; im.onerror = function () { bad(new Error('Could not load image')); };
      im.src = src;
    });
  }
  // Achica a max 1280px y regresa dataURL jpeg (asi la IA recibe algo ligero)
  function shrink(source, w, h) {
    var max = 1280, s = Math.min(1, max / Math.max(w, h));
    var c = document.createElement('canvas'); c.width = Math.round(w * s); c.height = Math.round(h * s);
    c.getContext('2d').drawImage(source, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.82);
  }
  // Toma 3 cuadros del video (20%, 50%, 85%)
  function videoFrames(file) {
    return new Promise(function (ok, bad) {
      var v = document.createElement('video'); v.muted = true; v.playsInline = true; v.preload = 'auto';
      var url = URL.createObjectURL(file); v.src = url;
      var out = [], marks = [0.2, 0.5, 0.85], i = 0;
      v.onerror = function () { URL.revokeObjectURL(url); bad(new Error('Could not read this video')); };
      v.onloadedmetadata = function () { v.currentTime = Math.max(0.1, v.duration * marks[0]); };
      v.onseeked = function () {
        out.push(shrink(v, v.videoWidth, v.videoHeight));
        i++;
        if (i < marks.length) v.currentTime = Math.max(0.1, v.duration * marks[i]);
        else { URL.revokeObjectURL(url); ok(out); }
      };
    });
  }
  async function addFiles(list) {
    var files = Array.prototype.slice.call(list || []), err = '';
    note('Preparing…');
    for (var f of files) {
      if (S.items.length >= MAX) { err = 'Max ' + MAX + ' images. Remove some to add more.'; break; }
      try {
        if (/^video\//.test(f.type)) {
          var frames = await videoFrames(f);
          frames.forEach(function (d, k) { if (S.items.length < MAX) S.items.push({ data: d, label: 'video frame ' + (k + 1), video: true }); });
        } else if (/^image\//.test(f.type)) {
          var url = URL.createObjectURL(f);
          var im = await loadImg(url);
          S.items.push({ data: shrink(im, im.naturalWidth, im.naturalHeight), label: f.name.replace(/\.[^.]+$/, '') });
          URL.revokeObjectURL(url);
        }
      } catch (e) { err = e.message + ' (' + f.name + ')'; }
    }
    note(err, !!err);
    render();
  }
  async function addUrl(url, label) {
    if (S.items.length >= MAX) { note('Max ' + MAX + ' images.', true); return; }
    try {
      var im = await loadImg(url);
      S.items.push({ data: shrink(im, im.naturalWidth, im.naturalHeight), label: label || '' });
      render();
    } catch (e) { note('Could not use that photo', true); }
  }
  async function toggleRecent() {
    var box = $('aim-pick');
    if (box.style.display === 'block') { box.style.display = 'none'; return; }
    box.style.display = 'block'; box.innerHTML = '<div style="font-size:12px;color:var(--tx3);">Loading…</div>';
    try {
      var list = (await C.recentPhotos()) || [];
      if (!list.length) { box.innerHTML = '<div style="font-size:12px;color:var(--tx3);">No job photos yet. Upload them instead.</div>'; return; }
      box.innerHTML = '<div style="font-size:11px;color:var(--tx3);margin-bottom:6px;">Tap photos to add them</div><div class="aim-grid">' +
        list.slice(0, 40).map(function (p, i) {
          return '<div class="aim-th" data-i="' + i + '" title="' + esc(p.label) + '"><img src="' + esc(p.url) + '" loading="lazy"/>' +
            (p.label ? '<span class="tag">' + esc(/after/i.test(p.label) ? 'After' : /before/i.test(p.label) ? 'Before' : '') + '</span>' : '') + '</div>';
        }).join('') + '</div>';
      box.querySelectorAll('.aim-th').forEach(function (el) {
        el.onclick = function () {
          var p = list[+el.getAttribute('data-i')];
          el.style.opacity = '.4'; el.onclick = null;
          addUrl(p.url, /after/i.test(p.label) ? 'after' : /before/i.test(p.label) ? 'before' : '');
        };
      });
    } catch (e) { box.innerHTML = '<div style="font-size:12px;color:var(--red);">Could not load photos</div>'; }
  }
  function render() {
    var g = $('aim-grid'); if (!g) return;
    g.innerHTML = S.items.map(function (it, i) {
      return '<div class="aim-th"><img src="' + it.data + '"/><button type="button" class="x" data-i="' + i + '">×</button>' +
        '<span class="tag">' + (i + 1) + (it.video ? ' 🎥' : '') + '</span></div>';
    }).join('');
    g.querySelectorAll('.x').forEach(function (b) {
      b.onclick = function () { S.items.splice(+b.getAttribute('data-i'), 1); render(); };
    });
  }

  // ---------- IA ----------
  async function generate() {
    if (S.busy) return;
    if (!S.items.length) { note('Add at least one photo or video first.', true); return; }
    var btn = $('aim-go'); S.busy = true; btn.disabled = true; btn.textContent = '✨ Writing your post…';
    note('The AI is looking at your photos (about 10–20 seconds)…');
    try {
      var token = await C.getToken();
      var res = await fetch(FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (token || '') },
        body: JSON.stringify({
          platform: $('aim-plat').value, language: $('aim-lang').value, notes: $('aim-notes').value,
          business: C.business ? C.business() : {},
          images: S.items.map(function (it) { return { base64: it.data.split(',')[1], media_type: 'image/jpeg', label: it.label }; })
        })
      });
      var d = await res.json().catch(function () { return {}; });
      if (!res.ok || !d.result) throw new Error(d.error || ('Error ' + res.status));
      S.result = d.result; note('');
      showResult();
    } catch (e) { note('Could not create the post: ' + e.message, true); }
    S.busy = false; btn.disabled = false; btn.textContent = '✨ Create post';
  }

  function showResult() {
    var r = S.result || {};
    var hasPair = r.before > 0 && r.after > 0 && r.before !== r.after && S.items[r.before - 1] && S.items[r.after - 1];
    $('aim-res').innerHTML =
      '<div style="margin-top:16px;">' +
        (r.warning ? '<div style="background:#FEF3C7;color:#92400E;border-radius:10px;padding:10px 12px;font-size:12px;margin-bottom:10px;">⚠️ ' + esc(r.warning) + '</div>' : '') +
        (r.what_i_see ? '<div style="font-size:12px;color:var(--tx3);margin-bottom:8px;">👀 ' + esc(r.what_i_see) + '</div>' : '') +
        '<label class="form-label">Your post (you can edit it)</label>' +
        '<textarea class="form-input" id="aim-text" rows="9" style="white-space:pre-wrap;line-height:1.5;">' + esc(r.post || '') + '</textarea>' +
        (r.short ? '<div style="font-size:12px;color:var(--tx2);margin-top:6px;"><b>Short version:</b> ' + esc(r.short) + '</div>' : '') +
        '<div class="aim-btns">' +
          '<button type="button" class="btn btn-primary btn-sm" id="aim-copy">📋 Copy text</button>' +
          (navigator.share ? '<button type="button" class="btn btn-outline btn-sm" id="aim-share">📤 Share</button>' : '') +
          '<button type="button" class="btn btn-outline btn-sm" id="aim-again">🔄 Write another version</button>' +
        '</div>' +
        (hasPair ? '<div style="margin-top:16px;"><label class="form-label">Before & After image (AI picked photos ' + r.before + ' and ' + r.after + ')</label>' +
          '<canvas id="aim-cv"></canvas><div class="aim-btns"><button type="button" class="btn btn-outline btn-sm" id="aim-dl">⬇️ Download image</button>' +
          '<button type="button" class="btn btn-outline btn-sm" id="aim-swap">↔️ Swap before/after</button></div></div>'
          : '<div style="font-size:12px;color:var(--tx3);margin-top:12px;">Tip: add one photo before and one after cleaning and the AI will also make a Before & After image.</div>') +
        '<div style="font-size:11px;color:var(--tx3);margin-top:12px;">Always review the post before publishing. Do not post client faces, names or house numbers without permission.</div>' +
      '</div>';

    $('aim-copy').onclick = function () {
      navigator.clipboard.writeText($('aim-text').value).then(function () { note('✅ Copied. Paste it in ' + $('aim-plat').selectedOptions[0].text + '.'); });
    };
    $('aim-again').onclick = generate;
    if ($('aim-share')) $('aim-share').onclick = share;
    if (hasPair) {
      drawPair(S.items[r.before - 1].data, S.items[r.after - 1].data);
      $('aim-dl').onclick = function () {
        var a = document.createElement('a'); a.download = 'before-after.jpg'; a.href = $('aim-cv').toDataURL('image/jpeg', 0.92); a.click();
      };
      $('aim-swap').onclick = function () { var t = r.before; r.before = r.after; r.after = t; showResult(); };
    }
  }

  // Imagen cuadrada 1080x1080: arriba ANTES, abajo DESPUES, nombre del negocio
  async function drawPair(beforeSrc, afterSrc) {
    var cv = $('aim-cv'); if (!cv) return;
    var W = 1080, H = 1080, bar = 90; cv.width = W; cv.height = H;
    var x = cv.getContext('2d');
    var b = await loadImg(beforeSrc), a = await loadImg(afterSrc);
    var half = (H - bar) / 2;
    function cover(im, y, h) {
      var s = Math.max(W / im.naturalWidth, h / im.naturalHeight);
      var w2 = im.naturalWidth * s, h2 = im.naturalHeight * s;
      x.save(); x.beginPath(); x.rect(0, y, W, h); x.clip();
      x.drawImage(im, (W - w2) / 2, y + (h - h2) / 2, w2, h2); x.restore();
    }
    cover(b, 0, half); cover(a, half, half);
    x.fillStyle = '#fff'; x.fillRect(0, half - 3, W, 6);
    function tag(t, y, color) {
      x.font = 'bold 44px Arial'; var tw = x.measureText(t).width;
      x.fillStyle = color; x.fillRect(24, y + 24, tw + 40, 64);
      x.fillStyle = '#fff'; x.fillText(t, 44, y + 72);
    }
    tag('BEFORE', 0, 'rgba(0,0,0,.65)'); tag('AFTER', half, 'rgba(16,185,129,.9)');
    var biz = C.business ? C.business() : {};
    x.fillStyle = '#1E1B4B'; x.fillRect(0, H - bar, W, bar);
    x.fillStyle = '#fff'; x.font = 'bold 36px Arial'; x.textAlign = 'center';
    x.fillText([biz.name, biz.phone].filter(Boolean).join('  ·  ') || 'Before & After', W / 2, H - bar / 2 + 13);
    x.textAlign = 'left';
  }

  async function share() {
    var text = $('aim-text').value;
    try { await navigator.clipboard.writeText(text); } catch (e) {}
    var data = { text: text };
    var cv = $('aim-cv');
    if (cv) {
      try {
        var blob = await new Promise(function (ok) { cv.toBlob(ok, 'image/jpeg', 0.92); });
        var file = new File([blob], 'before-after.jpg', { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) data.files = [file];
      } catch (e) {}
    }
    try { await navigator.share(data); note('Text also copied — paste it if the app does not fill it in.'); }
    catch (e) { if (e && e.name !== 'AbortError') note('Could not open share: ' + e.message, true); }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
  window.aimMount = mount;
})();
