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

## セキュリティ（IP 制限の信頼モデル）

ミドルウェアは `ALLOWED_IPS` に含まれるクライアント IP のみ許可します。クライアントが送れる `X-Forwarded-For` / `X-Real-IP` の**先頭値は信頼しません**（偽装で allowlist を bypass できないようにするため）。

`lib/ip.ts` の解決順序:

1. ホストが付与する `request.ip`（Vercel など）
2. `cf-connecting-ip`（Cloudflare 経由）
3. `x-vercel-forwarded-for`（Vercel エッジ）
4. `TRUSTED_PROXY_HOPS` が 1 以上のときだけ `x-forwarded-for`（右から N 番目のホップ。単一 nginx なら `TRUSTED_PROXY_HOPS=1`）

上記のいずれでも IP が取れない場合は空扱いとなり、本番では 403 になります（開発時のみ IP 不明時に bypass）。

### 環境変数

| 変数 | 説明 |
|------|------|
| `ALLOWED_IPS` | 許可するクライアント IP（カンマ区切り）。例: 自宅・オフィスのグローバル IP、`127.0.0.1` |
| `TRUSTED_PROXY_HOPS` | 自前リバースプロキシのみのときに設定。0 または未設定なら `X-Forwarded-For` は無視 |

Cloudflare や Vercel の手前に置く場合は、オリジンへ直接アクセスできないようファイアウォールも併用してください（偽装ヘッダーはエッジ経由では上書きされますが、直アクセスは別問題です）。

### テスト

```bash
npm test
```

`lib/ip.test.ts` で偽装 `X-Forwarded-For` が allowlist を通らないことを確認できます。
