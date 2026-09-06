# OMOROKU FILMS — 次世代シネマティック映像制作スタジオ LP

映画・CM・ブランドムービーの制作スタジオ「**OMOROKU FILMS**」のシネマティックなランディングページ（LP）です。

🌐 **Webサイト（GitHub Pages）**: [https://naoya-we.github.io/omoroku-lp/](https://naoya-we.github.io/omoroku-lp/)

---

## 🌟 主な機能・演出

1. **背景動画の完全スクロール双方向連動（ハイブリッド映像エンジン）**
   - **下スクロール**: 映像がリアルタイムに前進（`▼ 順再生 (FORWARD)`）。スクロール速度に応じた滑らかな可変速再生。
   - **上スクロール**: スクロールを戻すと映像も元のシーンへ巻き戻し（`▲ 巻き戻し (REWIND)`）。
   - **スクロール停止**: 自動で一時停止（`STANDBY`）。
2. **スクロール連動カメラマンキャラクター**
   - 画面最下部のトラック上を、スクロール速度と進行度に合わせてディレクターキャラクターが歩行・ダッシュ・アイドリング。
   - スクロールを上に戻すと瞬時に左を向いて反転走。
3. **映画撮影カメラHUDオーバーレイ**
   - リアルタイム・タイムコード（`HH:MM:SS:FF`）、チャプター表示、FPSカウンター、RECインジケーター。
4. **シネマ没入モード（Cinema Mode）**
   - ヘッダーのボタンで字幕やテキストUIをフェードアウトさせ、純粋な動画とキャラクターの走りだけを100%全画面で楽しめる特別モード。
5. **インタラクティブ実績モーダル**
   - 各ジャンルの制作実績をワンクリックでポップアッププレビュー。

---

## 🛠️ 使用技術

- **Core**: HTML5, Vanilla JavaScript, Vanilla CSS
- **Animation**: GSAP 3 + ScrollTrigger
- **Styling**: Tailwind CSS, Custom Cinema Design System
- **Icons**: Lucide Icons
- **Video**: 4K/60fps Anamorphic Pipeline (Veo Cinematic Shot)
