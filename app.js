// アプリケーションの状態管理
const state = {
  currentScreen: 'grid', // 'grid' または 'practice'
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

    card.addEventListener('click', () => openPractice(char));
    gridContainer.appendChild(card);
  });

  // マスコットのテキスト
  updateMascotText('あいてるワクを<br>えらんでね！');

  appContainer.appendChild(gridContainer);
}

/**
 * 練習画面の描画
 */
function openPractice(char) {
  state.currentScreen = 'practice';
  state.selectedChar = char;
  appContainer.innerHTML = '';

  const charData = hiraganaData[char];

  // ヘッダー生成
  const header = document.createElement('header');
  header.innerHTML = `
    <div class="header-back-row">
      <button class="back-button" id="btn-back">もどる</button>
    </div>
    <h1>「${char}」をかいてみよう</h1>
  `;
  appContainer.appendChild(header);

  document.getElementById('btn-back').addEventListener('click', renderGrid);

  // マスコットのテキスト更新
  updateMascotText('ここを<br>なぞってね！');

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

  // コントロールボタン
  const controls = document.createElement('div');
  controls.className = 'controls';

  const replayBtn = document.createElement('button');
  replayBtn.className = 'action-btn btn-replay';
  replayBtn.innerText = 'もういちど';
  replayBtn.addEventListener('click', () => {
    updateMascotText('もういっかい！');
    replayAnimation();
  });

  const doneBtn = document.createElement('button');
  doneBtn.className = 'action-btn btn-done';
  doneBtn.innerText = 'できた！';
  doneBtn.addEventListener('click', () => {
    updateMascotText('すごい！<br>よくできたね🌟');
    state.clearedChars.add(char);
    saveState();
    fireConfetti();
    // 2.5秒後に一覧に戻る
    setTimeout(renderGrid, 2500);
  });

  controls.appendChild(replayBtn);
  controls.appendChild(doneBtn);
  practiceScreen.appendChild(controls);

  appContainer.appendChild(practiceScreen);
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
