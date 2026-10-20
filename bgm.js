/* サイトの BGM（経済指標カレンダーの見方のページ以外で読み込む）
   ・ページを移っても初めからにならない：再生位置をこのタブの間だけ覚えて（sessionStorage）、次のページで続きから鳴らす
   ・最初は「鳴らす」設定。右下の ♪ で止める／流す。止めた設定は次に来た時も覚えておく（localStorage）
   ・サイトの中のリンクを押した時は、音を0.2秒で小さくしてから移り、次のページで0.6秒かけて元の大きさに戻す
   ・ブラウザは、ページを開いただけでは音を出させない。その時は、ページのどこかを最初に押した時に続きから鳴らす
   ・「動きを減らす」設定とは関係なく、♪ でいつでも止められる */
(() => {
  const SRC = 'bgm.m4a';
  const VOL = 0.4;
  const K_ON = 'atl_bgm_on', K_T = 'atl_bgm_t';
  const get = (st, k) => { try { return st.getItem(k); } catch (e) { return null; } };
  const set = (st, k, v) => { try { st.setItem(k, v); } catch (e) {} };

  let on = get(localStorage, K_ON) !== '0';                 // 何も覚えていなければ「鳴らす」
  const t0 = parseFloat(get(sessionStorage, K_T)) || 0;      // 前のページで止まった位置（秒）

  const a = new Audio(SRC + (t0 > 0 ? '#t=' + t0.toFixed(2) : ''));
  a.loop = true;
  a.preload = 'auto';
  a.volume = 0;

  const save = () => { if (a.currentTime > 0) set(sessionStorage, K_T, String(a.currentTime)); };
  let lastSave = 0;
  a.addEventListener('timeupdate', () => { const n = Date.now(); if (n - lastSave > 1000) { lastSave = n; save(); } });
  window.addEventListener('pagehide', save);

  // ゆっくり大きくする（いきなり鳴らさない）
  let fadeTimer = 0;
  const fadeTo = (target, ms, done) => {
    clearInterval(fadeTimer);
    const from = a.volume, start = Date.now();
    fadeTimer = setInterval(() => {
      const k = Math.min(1, (Date.now() - start) / ms);
      a.volume = from + (target - from) * k;
      if (k >= 1) { clearInterval(fadeTimer); if (done) done(); }
    }, 40);
  };

  // ♪ ボタン
  const css = document.createElement('style');
  css.textContent = [
    '.bgm-btn{position:fixed;right:16px;bottom:16px;z-index:9999;width:46px;height:46px;border-radius:50%;',
    'border:1px solid rgba(212,175,55,0.6);background:rgba(8,14,30,0.78);color:#f3d98b;font-size:21px;line-height:1;',
    'display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);',
    'box-shadow:0 4px 16px rgba(0,0,0,0.35);transition:transform .2s,opacity .2s;font-family:sans-serif;padding:0}',
    '.bgm-btn:hover{transform:scale(1.08)}',
    '.bgm-btn.off{opacity:.55;color:#94a3b8;border-color:rgba(148,163,184,0.5)}',
    '.bgm-btn.off::after{content:"";position:absolute;width:26px;height:2px;background:currentColor;transform:rotate(-45deg);border-radius:2px}',
    '.bgm-btn.wait{animation:bgm-pulse 1.6s ease-in-out infinite}',
    '@keyframes bgm-pulse{0%,100%{box-shadow:0 0 0 0 rgba(212,175,55,0.55)}50%{box-shadow:0 0 0 9px rgba(212,175,55,0)}}',
    '@media(prefers-reduced-motion:reduce){.bgm-btn.wait{animation:none}}'
  ].join('');
  document.head.appendChild(css);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bgm-btn';
  btn.textContent = '♪';
  const ui = () => {
    const playing = on && !a.paused;
    btn.classList.toggle('off', !on);
    btn.classList.toggle('wait', on && a.paused);
    btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    btn.title = !on ? 'BGM を流す' : (a.paused ? '押すと BGM が流れます' : 'BGM を止める');
    btn.setAttribute('aria-label', btn.title);
  };

  const play = () => {
    const p = a.play();
    if (p && p.then) p.then(() => { fadeTo(VOL, 600); ui(); }).catch(() => { ui(); waitGesture(); });
    else { fadeTo(VOL, 600); ui(); }
  };
  // ブラウザに止められた時は、最初にどこかを押した時に鳴らす
  let waiting = false;
  const waitGesture = () => {
    if (waiting) return; waiting = true;
    const go = (e) => {
      if (e && e.target === btn) return;                     // ♪ を押した時は、ボタンの処理に任せる
      ['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => document.removeEventListener(ev, go, true));
      waiting = false;
      if (on && a.paused) play();
    };
    ['pointerdown', 'touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, go, true));
  };

  btn.addEventListener('click', () => {
    if (on && !a.paused) {                                   // 鳴っている → 止める
      on = false; set(localStorage, K_ON, '0');
      fadeTo(0, 300, () => { a.pause(); save(); ui(); });
    } else {                                                 // 止まっている／止められていた → 流す
      on = true; set(localStorage, K_ON, '1');
      play();
    }
    ui();
  });
  a.addEventListener('play', ui);
  a.addEventListener('pause', ui);
  // サイトの中のリンクを押した時は、音を0.2秒で小さくしてから移る（途切れを目立たなくする）
  // 新しいタブ・外のサイト・同じページの中の移動・修飾キー付きのクリックでは何もしない
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest && e.target.closest('a[href]');
    if (!link || link.hasAttribute('download')) return;
    const tg = (link.getAttribute('target') || '').toLowerCase();
    if (tg && tg !== '_self') return;
    const to = new URL(link.href, location.href);
    if (to.origin !== location.origin || to.protocol !== location.protocol) return;
    if (to.pathname === location.pathname && to.search === location.search) return;   // 同じページの中（#…）
    if (!on || a.paused || a.volume <= 0.01) return;      // 鳴っていない時は、ふつうに移る
    e.preventDefault();
    save();
    let gone = false;
    const leave = () => { if (gone) return; gone = true; save(); location.href = to.href; };
    fadeTo(0, 200, leave);
    setTimeout(leave, 350);                                 // 念のため（小さくし終わらなくても移る）
  });

  // 戻るボタンでページが復元された時（bfcache）も続きから
  window.addEventListener('pageshow', (e) => { if (e.persisted && on && a.paused) play(); });

  const mount = () => { document.body.appendChild(btn); ui(); if (on) play(); };
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
})();
