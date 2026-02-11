# Studio

Next.js + TailwindCSS + Drizzle + Turso で構築した、Gemini + Remotion ベースの画像/動画生成スタジオです。

## 機能

- `.env` の `ALLOWED_IPS` による IP アドレス制限
- サイドバー + チャット履歴 + チャットバブル UI
- セッションはメモリ保持しつつ、Turso に履歴永続化
- `google/genai` を使った Gemini 応答
- `/image <prompt>` で Imagen による画像生成
- `/video <prompt>` で Veo による動画生成
- 画像添付付きチャット（動画生成時の image-to-video 入力として利用）
- 生成メディア一覧と Remotion 編集モード

## セットアップ

```bash
bun install
cp .env.example .env
bun run dev
```

## 主要API

- `POST /api/chat` チャット送信（画像添付可）
- `GET /api/sessions` セッション一覧
- `GET /api/sessions?sessionId=...` セッション内メッセージ
- `GET /api/media` 生成済みメディア一覧
- `POST /api/media/edit` Remotion編集動画を生成

## 備考

- 生成ファイルは `public/generated` に保存されます。
- Remotion編集はサーバー側レンダリングのため、初回は依存バンドルで時間がかかります。
