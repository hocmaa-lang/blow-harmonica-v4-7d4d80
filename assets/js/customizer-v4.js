/* פאנל "התאמה אישית" V4 — לתצוגה המקדימה בלבד (לא נכלל בשופיפיי) */
(function () {
  'use strict';
  var root = document.getElementById('eh4');
  var panel = document.getElementById('cz');
  var gear = document.getElementById('czGear');
  if (!root || !panel || !gear) return;
  if (/[?&]clean=1/.test(location.search)) { gear.remove(); panel.remove(); return; }

  var KEY = 'blow-v4-customizer';
  var VARS = [['--c-primary', 'פליז / הדגשה'], ['--c-secondary', 'טקסט משני'], ['--c-bg', 'קטיפה (רקע כהה)'], ['--c-text', 'טקסט על כהה'], ['--c-surface', 'נייר (רקע בהיר)']];
  var PRESETS = [
    { id: 'espresso', name: 'אספרסו · פליז', c: { '--c-primary': '#B08D57', '--c-secondary': '#A89B8A', '--c-bg': '#140E0B', '--c-text': '#F3ECE0', '--c-surface': '#F2EBDF' } },
    { id: 'ink', name: 'דיו · שמפניה', c: { '--c-primary': '#C8B08A', '--c-secondary': '#9CA1A8', '--c-bg': '#0E1115', '--c-text': '#EEF0F2', '--c-surface': '#EEEAE3' } },
    { id: 'bordeaux', name: 'בורדו · זהב', c: { '--c-primary': '#C29A5B', '--c-secondary': '#B49C98', '--c-bg': '#1C0C0F', '--c-text': '#F5ECE6', '--c-surface': '#F4ECE4' } }
  ];
  var DEFAULTS = PRESETS[0].c;

  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode / blocked */ } }
  var state = load(); state.colors = state.colors || {}; state.texts = state.texts || {};

  function lum(hex) {
    var h = String(hex).replace('#', ''); if (h.length === 3) h = h.replace(/./g, '$&$&');
    var n = parseInt(h, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  }
  function col(k) { return state.colors[k] || DEFAULTS[k]; }
  function applyColors() {
    VARS.forEach(function (v) { var val = state.colors[v[0]]; if (val) root.style.setProperty(v[0], val); else root.style.removeProperty(v[0]); });
    document.body.style.background = col('--c-bg');
    /* ink on the paper sections: the velvet colour if it is dark, otherwise the text colour */
    root.style.setProperty('--c-ink', lum(col('--c-bg')) < .45 ? col('--c-bg') : col('--c-text'));
    var meta = document.querySelector('meta[name=theme-color]'); if (meta) meta.setAttribute('content', col('--c-bg'));
    var darkBg = lum(col('--c-bg')) < .45;
    Array.prototype.forEach.call(root.querySelectorAll('img[data-logo]'), function (img) {
      img.src = img.src.replace(darkBg ? 'logo-dark' : 'logo-light', darkBg ? 'logo-light' : 'logo-dark');
    });
    Array.prototype.forEach.call(presetsBox.children, function (b, i) {
      var p = PRESETS[i].c; b.classList.toggle('is-on', VARS.every(function (v) { return col(v[0]).toUpperCase() === p[v[0]].toUpperCase(); }));
    });
    syncInputs();
  }
  function setHTML(el, html) { el.innerHTML = html; }
  function applyTexts() {
    Object.keys(state.texts).forEach(function (k) {
      Array.prototype.forEach.call(root.querySelectorAll('[data-k="' + k + '"]'), function (el) { setHTML(el, state.texts[k]); });
    });
    if (window.EH_render) window.EH_render();
  }

  /* UI */
  var presetsBox = document.getElementById('czPresets');
  PRESETS.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'cz__preset'; b.setAttribute('data-preset', p.id);
    b.innerHTML = '<span class="cz__dots">' + ['--c-bg', '--c-surface', '--c-primary', '--c-text'].map(function (k) { return '<i style="background:' + p.c[k] + '"></i>'; }).join('') + '</span>' + p.name;
    b.addEventListener('click', function () { applyPreset(i); });
    presetsBox.appendChild(b);
  });
  var colorsBox = document.getElementById('czColors');
  var inputs = {};
  VARS.forEach(function (v) {
    var l = document.createElement('label'); l.className = 'cz__color';
    var i = document.createElement('input'); i.type = 'color';
    i.addEventListener('input', function () { state.colors[v[0]] = i.value; save(state); applyColors(); });
    var s = document.createElement('span'); s.textContent = v[1];
    var code = document.createElement('code');
    l.appendChild(i); l.appendChild(s); l.appendChild(code);
    colorsBox.appendChild(l); inputs[v[0]] = { i: i, code: code };
  });
  function syncInputs() {
    VARS.forEach(function (v) {
      var val = col(v[0]).toUpperCase();
      inputs[v[0]].i.value = val.length === 7 ? val.toLowerCase() : '#000000';
      inputs[v[0]].code.textContent = val;
    });
  }
  function applyPreset(i) { state.colors = Object.assign({}, PRESETS[i].c); save(state); applyColors(); }

  function toggle(open) { panel.hidden = !open; gear.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  gear.addEventListener('click', function () { toggle(panel.hidden); });
  document.getElementById('czClose').addEventListener('click', function () { toggle(false); });

  /* inline editing */
  var editBox = document.getElementById('czEdit');
  function clean(el) { return el.innerHTML; }
  editBox.addEventListener('change', function () {
    var on = editBox.checked;
    root.classList.toggle('cz-editing', on);
    Array.prototype.forEach.call(root.querySelectorAll('[data-k]'), function (el) { if (on) el.setAttribute('contenteditable', 'true'); else el.removeAttribute('contenteditable'); });
  });
  root.addEventListener('input', function (e) {
    if (!root.classList.contains('cz-editing')) return;
    var el = e.target.closest && e.target.closest('[data-k]'); if (!el) return;
    var k = el.getAttribute('data-k');
    state.texts[k] = clean(el); save(state);
    Array.prototype.forEach.call(root.querySelectorAll('[data-k="' + k + '"]'), function (o) { if (o !== el) setHTML(o, state.texts[k]); });
  });
  root.addEventListener('click', function (e) {
    if (root.classList.contains('cz-editing') && e.target.closest('[data-k]')) e.preventDefault();
  }, true);

  /* export / reset */
  document.getElementById('czExport').addEventListener('click', function () {
    var colors = {}; VARS.forEach(function (v) { colors[v[0]] = col(v[0]).toUpperCase(); });
    var data = { exported: new Date().toISOString(), version: 'v4', colors: colors, texts: Object.assign({}, window.EH_CONTENT || {}, state.texts) };
    window.EH_LAST_EXPORT = data;
    try {
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'blow-v4-settings.json';
      document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    } catch (e) { /* ignore */ }
    if (window.EH_toast) window.EH_toast('ההגדרות יוצאו לקובץ JSON');
  });
  document.getElementById('czReset').addEventListener('click', function () {
    state = { colors: {}, texts: {} };
    try { localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
    var C = window.EH_CONTENT || {};
    Array.prototype.forEach.call(root.querySelectorAll('[data-k]'), function (el) { var k = el.getAttribute('data-k'); if (C[k] != null) setHTML(el, C[k]); });
    applyColors(); if (window.EH_render) window.EH_render();
    if (window.EH_toast) window.EH_toast('אופס לברירת המחדל');
  });

  applyColors(); applyTexts();
  window.EH_cz = { state: function () { return state; }, presets: PRESETS, applyPreset: applyPreset };
})();
