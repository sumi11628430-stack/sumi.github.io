/* アイコンのまわりを昇る、キラキラ光る欠片（配布中 EA 一覧の3つのアイコン）
   data-shards="色の組" を付けた枠の中に欠片を作り、上に着くたびに次の動きをランダムに決め直す。
   ランダムにする物：横の位置・縦横の形（大きさ）・最初の向き（縦・横・斜め）・昇る速さ・回転の速さと向き・光る時（1〜2回）
   「動きを減らす」設定の人には欠片を出さない */
(() => {
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!Element.prototype.animate) return;
  const PALETTE = {
    crystal: ['#67e8f9', '#c4b5fd', '#ffffff', '#93c5fd'],   // 次期 EA の結晶：水色・薄紫・白・薄い青
    sage:    ['#67e8f9', '#93c5fd', '#ffffff', '#bae6fd'],   // 賢者：青・水色・白
    grand:   ['#fcd34d', '#fde68a', '#ffffff', '#67e8f9']    // 大賢者：金を混ぜて華やかに
  };
  const COUNT = 6;
  const r = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function run(shard, gem, spark, colors, first) {
    const w = r(4, 7), h = w * r(1.2, 2.2);                    // 縦横の形
    const c = pick(colors);
    shard.style.left = r(8, 92) + '%';
    shard.style.setProperty('--c', c);
    shard.style.width = shard.style.height = (Math.max(w, h) * 1.8) + 'px';
    gem.style.width = w + 'px'; gem.style.height = h + 'px';
    spark.style.width = spark.style.height = (Math.max(w, h) * 1.4) + 'px';
    const dur = r(6400, 9200);                                 // 昇る速さ（前回お願いの「半分の速さ」＝6.4〜9.2秒の中でランダム）
    const rise = r(64, 80);                                    // 昇る高さ（px）
    const rot0 = r(0, 180);                                    // 最初の向き（縦・横・斜めをランダムに）
    const rot = (Math.random() < 0.5 ? -1 : 1) * r(60, 260);  // 回転の速さと向き（1回で回る角度）
    const tws = [r(0.22, 0.5)]; if (Math.random() < 0.7) tws.push(r(0.62, 0.85));   // 光る時（1〜2回）
    const peak = r(1.2, 1.4);
    // 昇る・回る・光る時に少し大きくなる
    const frames = [{ offset: 0, opacity: 0, k: 0, s: 0.5 }, { offset: 0.12, opacity: 0.85, k: 0.12, s: 1 }];
    tws.forEach(t => { frames.push({ offset: t - 0.05, opacity: 0.75, k: t - 0.05, s: 1 }, { offset: t, opacity: 1, k: t, s: peak }, { offset: t + 0.05, opacity: 0.75, k: t + 0.05, s: 1 }); });
    frames.push({ offset: 1, opacity: 0, k: 1, s: 0.6 });
    const kf = frames.map(f => ({ offset: f.offset, opacity: f.opacity, transform: `translate(-50%, ${(-rise * f.k).toFixed(1)}px) rotate(${(rot0 + rot * f.k).toFixed(1)}deg) scale(${f.s})` }));
    const sparkKf = [{ offset: 0, opacity: 0 }];
    tws.forEach(t => { sparkKf.push({ offset: t - 0.05, opacity: 0 }, { offset: t, opacity: 0.8 }, { offset: t + 0.05, opacity: 0 }); });
    sparkKf.push({ offset: 1, opacity: 0 });
    const a = shard.animate(kf, { duration: dur, easing: 'linear' });
    const b = spark.animate(sparkKf, { duration: dur, easing: 'linear' });
    if (first) { const t = Math.random() * dur; a.currentTime = t; b.currentTime = t; }   // 最初は途中から（一斉に下から出ないように）
    a.onfinish = () => run(shard, gem, spark, colors, false);   // 上に着いたら、次の動きを決め直す
  }

  function setup(box) {
    const colors = PALETTE[box.dataset.shards] || PALETTE.crystal;
    for (let i = 0; i < COUNT; i++) {
      const shard = document.createElement('span'); shard.className = 'shard';
      const gem = document.createElement('span'); gem.className = 'shard-gem';
      const spark = document.createElement('span'); spark.className = 'shard-spark';
      shard.append(gem, spark); box.appendChild(shard);
      run(shard, gem, spark, colors, true);
    }
  }
  const start = () => document.querySelectorAll('[data-shards]').forEach(setup);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
