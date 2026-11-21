/*!
 * 信州COWCOW堂 出張買取 予約フォーム 埋め込み用スクリプト
 *
 * 【LPの中に表示する】
 *   <div data-cowcow-yoyaku="inline"></div>
 *   <script src="https://shinshu-cowcow.github.io/yoyaku/embed.js" async></script>
 *
 * 【ボタンでポップアップ表示する】
 *   <a href="#" data-cowcow-yoyaku-open>出張買取を予約する</a>
 *   <script src="https://shinshu-cowcow.github.io/yoyaku/embed.js" async></script>
 *
 * 固定ヘッダーがあるLPは、script タグに data-offset="ヘッダーの高さ(px)" を付けてください。
 *
 * 計測：予約の開始・完了時に dataLayer へ
 *   yoyaku_open / yoyaku_start / yoyaku_complete を送ります（Googleタグマネージャー用）。
 *   完了時は gtag('event','generate_lead') と fbq('track','Lead') もあれば呼びます。
 *   window の 'cowcowYoyaku' イベントでも受け取れます。
 */
(function () {
  if (window.CowcowYoyaku) return;
  var me = document.currentScript || (function () { var s = document.querySelectorAll('script[src*="embed.js"]'); return s[s.length - 1]; })();
  var BASE = (me && me.src ? me.src : 'https://shinshu-cowcow.github.io/yoyaku/embed.js').replace(/embed\.js.*$/, '');
  var ORIGIN = new URL(BASE, location.href).origin;
  var OFFSET = parseInt((me && me.getAttribute('data-offset')) || '0', 10) || 0;
  var frames = [];
  var overlay = null;

  function track(ev, data) {
    data = data || {};
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'yoyaku_' + ev, yoyaku_type: data.requestType || '', yoyaku_id: data.id || '' });
    } catch (e) {}
    if (ev === 'complete') {
      try { if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { method: '出張買取予約', request_type: data.requestType || '' }); } catch (e) {}
      try { if (typeof window.fbq === 'function') window.fbq('track', 'Lead'); } catch (e) {}
    }
    try { window.dispatchEvent(new CustomEvent('cowcowYoyaku', { detail: { type: ev, requestType: data.requestType, id: data.id } })); } catch (e) {}
  }

  function makeFrame(mode) {
    var f = document.createElement('iframe');
    f.src = BASE + '?embed=' + mode;
    f.title = '出張買取 ご予約フォーム';
    f.setAttribute('data-mode', mode);
    f.setAttribute('loading', mode === 'inline' ? 'lazy' : 'eager');
    f.style.cssText = 'width:100%;border:0;display:block;background:transparent;' + (mode === 'inline' ? 'height:1500px;' : 'height:100%;');
    frames.push(f);
    return f;
  }

  window.addEventListener('message', function (e) {
    if (e.origin !== ORIGIN) return;
    var d = e.data || {};
    if (d.source !== 'cowcow-yoyaku') return;
    var f = null;
    for (var i = 0; i < frames.length; i++) if (frames[i].contentWindow === e.source) f = frames[i];
    if (!f) return;
    if (d.event === 'height' && f.getAttribute('data-mode') === 'inline') {
      f.style.height = Math.max(480, Math.ceil(d.height)) + 'px';
    } else if (d.event === 'scrollTo' && f.getAttribute('data-mode') === 'inline') {
      var top = f.getBoundingClientRect().top + window.pageYOffset + (d.y || 0) - OFFSET;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } else if (d.event === 'start' || d.event === 'complete') {
      track(d.event, d);
    }
  });

  function mountInline() {
    var els = document.querySelectorAll('[data-cowcow-yoyaku="inline"], #cowcow-yoyaku');
    for (var i = 0; i < els.length; i++) {
      if (els[i].getAttribute('data-mounted')) continue;
      els[i].setAttribute('data-mounted', '1');
      els[i].appendChild(makeFrame('inline'));
    }
  }

  function openPopup() {
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;';
      var box = document.createElement('div');
      var wide = window.matchMedia('(min-width:600px)').matches;
      box.style.cssText = 'position:relative;background:#f4f6f8;width:100%;max-width:520px;height:' + (wide ? '92vh' : '100%') + ';' + (wide ? 'border-radius:14px;overflow:hidden;' : '') + 'box-shadow:0 10px 40px rgba(0,0,0,.35);';
      var close = document.createElement('button');
      close.type = 'button';
      close.setAttribute('aria-label', '閉じる');
      close.innerHTML = '&times;';
      close.style.cssText = 'position:absolute;top:8px;right:8px;z-index:2;width:36px;height:36px;border-radius:50%;border:none;background:rgba(0,0,0,.55);color:#fff;font-size:24px;line-height:36px;cursor:pointer;';
      close.onclick = closePopup;
      overlay.onclick = function (e) { if (e.target === overlay) closePopup(); };
      box.appendChild(close);
      box.appendChild(makeFrame('popup'));
      overlay.appendChild(box);
      document.body.appendChild(overlay);
    }
    overlay.style.display = 'flex';
    overlay._prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    track('open');
  }

  function closePopup() {
    if (!overlay) return;
    overlay.style.display = 'none';
    document.body.style.overflow = overlay._prevOverflow || '';
  }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-cowcow-yoyaku-open], a[href$="#cowcow-yoyaku-popup"]') : null;
    if (t) { e.preventDefault(); openPopup(); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePopup(); });

  window.CowcowYoyaku = { open: openPopup, close: closePopup };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountInline); else mountInline();
})();
