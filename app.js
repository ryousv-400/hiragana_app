// アプリケーションの状態管理
const state = {
  currentScreen: 'grid', // 'grid' | 'practice' | 'writing'
  selectedChar: null,
  clearedChars: new Set(JSON.parse(localStorage.getItem('kakikata_cleared') || '[]'))
};

// 五十音順の定義（グリッド表示用）
const hiraganaOrder = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん".split('');

const appContainer = document.getElementById('app');
const mascotSpeech = document.getElementById('mascot-speech');

/**
 * マスコットへの言葉を更新する
 */
function updateMascotText(htmlContent) {
  if (mascotSpeech) {
    mascotSpeech.innerHTML = htmlContent;
  }
}

/**
 * 状態を保存
 */
function saveState() {
  localStorage.setItem('kakikata_cleared', JSON.stringify([...state.clearedChars]));
}

/**
 * 紙吹雪エフェクトを再生
 */
function fireConfetti() {
  const duration = 2000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      return clearInterval(interval);
    }

    const particleCount = 50 * (timeLeft / duration);
    confetti(Object.assign({}, defaults, {
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
    }));
    confetti(Object.assign({}, defaults, {
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
    }));
  }, 250);
}

/**
 * メイン画面（一覧）の描画
 */
function renderGrid() {
  state.currentScreen = 'grid';
  state.selectedChar = null;
  appContainer.innerHTML = ''; // クリア

  // ヘッダー生成
  const header = document.createElement('header');
  header.innerHTML = `<h1>たのしい ひらがな</h1>`;
  appContainer.appendChild(header);

  // グリッド生成
  const gridContainer = document.createElement('div');
  gridContainer.className = 'grid-container';

  hiraganaOrder.forEach(char => {
    // データが存在するか確認（KanjiVGから取得できたものだけ）
    if (!hiraganaData[char]) return;

    const card = document.createElement('div');
    card.className = 'char-card';
    card.innerText = char;

    // クリア済みなら星マークをつける
    if (state.clearedChars.has(char)) {
      card.classList.add('clear');
      const star = document.createElement('div');
      star.className = 'star';
      star.innerText = '⭐';
      card.appendChild(star);
    }

    card.addEventListener('click', () => {
      SoundManager.playPop();
      openPractice(char);
    });
    gridContainer.appendChild(card);
  });

  // マスコットのテキスト
  updateMascotText('あいてるワクを<br>えらんでね！');

  appContainer.appendChild(gridContainer);
}

/**
 * 練習画面の描画（書き順アニメーション表示）
 */
function openPractice(char) {
  state.currentScreen = 'practice';
  state.selectedChar = char;
  appContainer.innerHTML = '';

  const charData = hiraganaData[char];

  // ヘッダー生成
  const header = document.createElement('header');
  header.innerHTML = `
    <button class="back-button" id="btn-back">もどる</button>
    <h1>「${char}」をかいてみよう</h1>
    <div class="header-spacer"></div>
  `;
  appContainer.appendChild(header);

  document.getElementById('btn-back').addEventListener('click', () => {
    SoundManager.playPop();
    renderGrid();
  });

  // マスコットのテキスト更新
  updateMascotText('かきじゅんを<br>みてみよう！');

  // コンテンツ領域生成
  const practiceScreen = document.createElement('div');
  practiceScreen.className = 'practice-screen';

  // SVG キャンバス (KanjiVGのデータは元々 109x109 の viewBox で作られている)
  const canvasWrapper = document.createElement('div');
  canvasWrapper.className = 'canvas-wrapper';

  // SVGタグを構築
  let svgHTML = `<svg viewBox="0 0 109 109" id="hiragana-svg">`;

  // ガイド線（下敷き）
  svgHTML += `<g id="guide-strokes">`;
  charData.paths.forEach((pathD) => {
    svgHTML += `<path class="guide-path" d="${pathD}" />`;
  });
  svgHTML += `</g>`;

  // アニメーション用の線
  svgHTML += `<g id="animated-strokes">`;
  charData.paths.forEach((pathD, index) => {
    // 1画ごとに 1.5秒ずつ遅延させる（書き順表現）
    const delay = index * 1.5;
    svgHTML += `<path 
      class="draw-path animate-stroke" 
      style="animation-delay: ${delay}s;" 
      d="${pathD}" />`;
  });
  svgHTML += `</g>`;
  svgHTML += `</svg>`;

  canvasWrapper.innerHTML = svgHTML;
  practiceScreen.appendChild(canvasWrapper);

  // 各画ごとに筆音を鳴らす
  charData.paths.forEach((_, index) => {
    setTimeout(() => {
      SoundManager.playStroke();
    }, index * 1500 + 200); // アニメーション開始から少し遅れて鳴らす
  });

  // 書き順の番号を表示
  const strokeInfo = document.createElement('div');
  strokeInfo.className = 'stroke-info';
  strokeInfo.innerText = `${charData.paths.length} かく`;
  practiceScreen.appendChild(strokeInfo);

  // コントロールボタン
  const controls = document.createElement('div');
  controls.className = 'controls';

  const replayBtn = document.createElement('button');
  replayBtn.className = 'action-btn btn-replay';
  replayBtn.innerText = 'もういちど';
  replayBtn.addEventListener('click', () => {
    SoundManager.playReplay();
    updateMascotText('もういっかい<br>みてみよう！');
    replayAnimation();
    // 再再生時も筆音を鳴らす
    charData.paths.forEach((_, index) => {
      setTimeout(() => {
        SoundManager.playStroke();
      }, index * 1500 + 200);
    });
  });

  const writeBtn = document.createElement('button');
  writeBtn.className = 'action-btn btn-write';
  writeBtn.innerText = 'じぶんでかいてみよう！';
  writeBtn.addEventListener('click', () => {
    SoundManager.playStart();
    openWritingMode(char);
  });

  controls.appendChild(replayBtn);
  controls.appendChild(writeBtn);
  practiceScreen.appendChild(controls);

  appContainer.appendChild(practiceScreen);
}

/**
 * 書き練習モードを開く（Canvasで指/マウスなぞり書き）
 */
function openWritingMode(char) {
  state.currentScreen = 'writing';
  state.selectedChar = char;
  appContainer.innerHTML = '';

  const charData = hiraganaData[char];

  // ヘッダー生成
  const header = document.createElement('header');
  header.innerHTML = `
    <button class="back-button" id="btn-back-write">もどる</button>
    <h1>「${char}」をかこう！</h1>
    <div class="header-spacer"></div>
  `;
  appContainer.appendChild(header);

  document.getElementById('btn-back-write').addEventListener('click', () => {
    SoundManager.playPop();
    openPractice(char);
  });

  updateMascotText('ゆびで<br>なぞってね！✏️');

  const practiceScreen = document.createElement('div');
  practiceScreen.className = 'practice-screen';

  // Canvas + SVGガイドのラッパー
  const canvasWrapper = document.createElement('div');
  canvasWrapper.className = 'canvas-wrapper writing-mode';

  // ガイド線SVG（薄く表示）
  let svgHTML = `<svg viewBox="0 0 109 109" id="guide-svg" class="guide-svg-layer">`;
  svgHTML += `<g>`;
  charData.paths.forEach((pathD) => {
    svgHTML += `<path class="guide-path writing-guide" d="${pathD}" />`;
  });
  svgHTML += `</g>`;
  svgHTML += `</svg>`;

  // 描画用 Canvas
  const canvas = document.createElement('canvas');
  canvas.id = 'writing-canvas';
  canvas.className = 'writing-canvas';

  canvasWrapper.innerHTML = svgHTML;
  canvasWrapper.appendChild(canvas);
  practiceScreen.appendChild(canvasWrapper);

  // コントロールボタン
  const controls = document.createElement('div');
  controls.className = 'controls';

  const eraseBtn = document.createElement('button');
  eraseBtn.className = 'action-btn btn-erase';
  eraseBtn.innerText = 'けす';
  eraseBtn.addEventListener('click', () => {
    SoundManager.playErase();
    clearCanvas(canvas);
    updateMascotText('もういちど<br>かいてみよう！');
  });

  const doneBtn = document.createElement('button');
  doneBtn.className = 'action-btn btn-done';
  doneBtn.innerText = 'できた！';
  doneBtn.addEventListener('click', () => {
    SoundManager.playFanfare();
    setTimeout(() => SoundManager.playSparkle(), 500);
    updateMascotText('すごい！<br>よくできたね🌟');
    state.clearedChars.add(char);
    saveState();
    fireConfetti();
    // 2.5秒後に一覧に戻る
    setTimeout(renderGrid, 2500);
  });

  controls.appendChild(eraseBtn);
  controls.appendChild(doneBtn);
  practiceScreen.appendChild(controls);

  appContainer.appendChild(practiceScreen);

  // Canvas のセットアップ（DOM挿入後）
  requestAnimationFrame(() => setupCanvas(canvas));
}

/**
 * Canvas をセットアップ（描画イベントとサイズ調整）
 */
function setupCanvas(canvas) {
  const wrapper = canvas.parentElement;
  const rect = wrapper.getBoundingClientRect();

  // 高解像度対応
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = rect.width + 'px';
  canvas.style.height = rect.height + 'px';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // ペン設定（子供向けの太くて丸い線）
  ctx.strokeStyle = '#FF6B81';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  function getPosition(e) {
    const canvasRect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - canvasRect.left,
        y: e.touches[0].clientY - canvasRect.top
      };
    }
    return {
      x: e.clientX - canvasRect.left,
      y: e.clientY - canvasRect.top
    };
  }

  function startDraw(e) {
    e.preventDefault();
    isDrawing = true;
    const pos = getPosition(e);
    lastX = pos.x;
    lastY = pos.y;
    SoundManager.playTouch();
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawing) return;
    const pos = getPosition(e);

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();

    lastX = pos.x;
    lastY = pos.y;
  }

  function endDraw(e) {
    e.preventDefault();
    isDrawing = false;
  }

  // マウスイベント
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseleave', endDraw);

  // タッチイベント
  canvas.addEventListener('touchstart', startDraw, { passive: false });
  canvas.addEventListener('touchmove', draw, { passive: false });
  canvas.addEventListener('touchend', endDraw, { passive: false });
  canvas.addEventListener('touchcancel', endDraw, { passive: false });
}

/**
 * Canvas をクリアする
 */
function clearCanvas(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // ペン設定を再適用
  ctx.strokeStyle = '#FF6B81';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

/**
 * アニメーションを再再生する
 */
function replayAnimation() {
  const container = document.getElementById('animated-strokes');
  if (!container) return;

  const content = container.innerHTML;
  container.innerHTML = "";
  // リフロー（再描画）を強制的にトリガーしてアニメーションをリセット
  void container.offsetWidth;
  container.innerHTML = content;
}

// アプリの起動
document.addEventListener('DOMContentLoaded', () => {
  renderGrid();
});
