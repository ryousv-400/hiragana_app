/**
 * SoundManager - Web Audio API を使った効果音マネージャー
 * 外部ファイル不要。すべてプログラムで生成する子供向けの可愛い効果音。
 */
const SoundManager = (() => {
    let audioCtx = null;

    // ユーザー操作後に AudioContext を有効化する（ブラウザポリシー対策）
    function ensureContext() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    /**
     * カードタップ時のポップ音 - 軽い「ポン！」
     */
    function playPop() {
        const ctx = ensureContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.05);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    }

    /**
     * 書き順アニメーション中の筆音 - シュッ
     */
    function playStroke() {
        const ctx = ensureContext();

        // ノイズベースの筆音
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;

        // バンドパスフィルターで筆っぽい音に
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime);
        filter.Q.setValueAtTime(1.5, ctx.currentTime);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start(ctx.currentTime);
        source.stop(ctx.currentTime + 0.3);
    }

    /**
     * 「もういちど」ボタン - リプレイ音（下降→上昇の明るい音）
     */
    function playReplay() {
        const ctx = ensureContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.25);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
    }

    /**
     * 「できた！」ボタン - ファンファーレ（楽しいメロディー）
     */
    function playFanfare() {
        const ctx = ensureContext();
        const notes = [523, 659, 784, 1047]; // ド ミ ソ ド(高)
        const durations = [0.15, 0.15, 0.15, 0.4];

        let time = ctx.currentTime;
        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, time);

            gain.gain.setValueAtTime(0.15, time);
            gain.gain.setValueAtTime(0.15, time + durations[i] * 0.7);
            gain.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(time);
            osc.stop(time + durations[i]);

            // 2つめの音でハーモニー
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq * 1.5, time);
            gain2.gain.setValueAtTime(0.08, time);
            gain2.gain.exponentialRampToValueAtTime(0.01, time + durations[i]);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(time);
            osc2.stop(time + durations[i]);

            time += durations[i];
        });
    }

    /**
     * 書き練習の線引き開始 - 軽いタッチ音
     */
    function playTouch() {
        const ctx = ensureContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(1000, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.06);

        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    }

    /**
     * キラキラ音（書き練習クリア時や特別な瞬間）
     */
    function playSparkle() {
        const ctx = ensureContext();
        const freqs = [1200, 1600, 2000, 2400];

        freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

            gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
            gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.08 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + i * 0.08);
            osc.stop(ctx.currentTime + i * 0.08 + 0.25);
        });
    }

    /**
     * 「じぶんでかいてみよう！」ボタン - ワクワクする上昇音
     */
    function playStart() {
        const ctx = ensureContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.35);
    }

    /**
     * 消しゴム音
     */
    function playErase() {
        const ctx = ensureContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
    }

    return {
        playPop,
        playStroke,
        playReplay,
        playFanfare,
        playTouch,
        playSparkle,
        playStart,
        playErase
    };
})();
