# Cloud Memo

テキストメモ + ファイル添付（画像・PDF）を保存できる、完全無料枠で運用できるクラウド型メモアプリです。

- **フレームワーク**: Next.js (App Router) + TypeScript
- **UI**: Tailwind CSS
- **バックエンド**: Supabase（Auth / Postgres / Storage）

## 機能

- メール + パスワードによるサインアップ / ログイン / ログアウト（サーバーサイド判定）
- メモの作成・一覧・編集（自動保存）・削除
- アーカイブと、タイトル / 本文のキーワード検索
- 画像・PDF の添付（クライアントから Storage へ直接アップロード）
  - 画像はサムネイル、PDF はアイコン表示。クリックで署名付き URL を開く
  - 1ファイル最大 10MB、拡張子は png / jpg / jpeg / gif / webp / pdf のみ
- Row Level Security で「本人のデータのみ」を保証

---

## セットアップ手順

### 1. Supabase プロジェクトを作成

1. <https://supabase.com> でアカウントを作成し、新しいプロジェクトを作成します（無料枠で可）。
2. プロジェクト作成後、**Project Settings → API** を開き、次の2つを控えます。
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

> `service_role` key はこのアプリでは使用しません。クライアントに露出させないでください。

### 2. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を編集し、上で控えた値を入れます。

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

`.env.local` は `.gitignore` 済みのためコミットされません。

### 3. マイグレーションを適用（スキーマ + RLS + Storage ポリシー）

`supabase/migrations/` の SQL を順番に適用します。いずれかの方法で実行してください。

**方法 A: Supabase ダッシュボードの SQL Editor（最も簡単）**

1. ダッシュボードの **SQL Editor** を開きます。
2. `supabase/migrations/0001_init.sql` の内容を貼り付けて Run。
3. 続けて `supabase/migrations/0002_storage.sql` の内容を貼り付けて Run。

**方法 B: Supabase CLI**

```bash
# 事前に supabase CLI をインストール & login しておく
supabase link --project-ref <your-project-ref>
supabase db push
```

これにより以下が作成されます。

- `notes` / `attachments` テーブル、インデックス、`updated_at` 自動更新トリガー
- 両テーブルの RLS 有効化と「本人のみ」ポリシー
- **private** な `attachments` バケットと、`{user_id}/...` 配下のみ read/write/delete を許可する Storage ポリシー

### 4. attachments バケットの確認（private）

`0002_storage.sql` が `attachments` バケットを **private** で作成します。
ダッシュボードの **Storage** で `attachments` バケットが存在し、**Public が OFF（非公開）** になっていることを確認してください。
（手動で作る場合も、必ず "Public bucket" のチェックを外して private で作成します。）

Storage ポリシーは `0002_storage.sql` に含まれているため、別途設定する必要はありません。

### 5. ローカル起動

```bash
npm install
npm run dev
```

<http://localhost:3000> を開き、`/login` でアカウントを作成してください。

> メール確認が有効な場合、サインアップ後に確認メールのリンクを踏む必要があります。
> ローカルで素早く試すには、Supabase の **Authentication → Providers → Email** で
> "Confirm email" を一時的に OFF にできます。

---

## スクリプト

| コマンド | 内容 |
|----------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint 実行 |

## デプロイ（任意）

Vercel (Hobby) にデプロイする場合、プロジェクトのルートを `memo-app` に設定し、
環境変数 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を登録してください。

## ディレクトリ構成

```
memo-app/
├── app/
│   ├── login/page.tsx          # ログイン / サインアップ
│   ├── page.tsx                # メモ一覧（検索・アーカイブ）
│   ├── notes/[id]/page.tsx     # メモ編集 + 添付
│   ├── actions.ts              # Server Actions（作成 / アーカイブ / 削除）
│   └── auth/signout/route.ts   # ログアウト
├── components/                 # NoteCard, NoteEditor, Attachments など
├── lib/
│   ├── supabase/               # client.ts, server.ts, middleware.ts
│   ├── constants.ts            # バケット名 / 制限値 / バリデーション
│   └── types.ts                # DB 型
├── middleware.ts               # 認証ガード（未ログインは /login へ）
└── supabase/migrations/        # スキーマ + RLS + Storage ポリシー
```
