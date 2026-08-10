# まつだい早稲田じょんのびクラブ 公式サイト

新潟県十日町市まつだいで活動する早稲田大学の学生サークル
「まつだい早稲田じょんのびクラブ」の公式サイトです。

- **目的**: 新入生に活動の魅力を伝え、公式Instagram(@jonnobiclub_official)のDMへ誘導する
- **最重要指標**: Instagramクリック率 = IGクリック人数 ÷ 訪問者数 × 100

## 技術構成

| 役割 | 技術 |
|---|---|
| フレームワーク | Next.js 15 (App Router) / TypeScript / Tailwind CSS v4 |
| データベース・認証・画像 | Supabase (Database / Auth / Storage) |
| アクセス分析 | 自前計測(Supabaseに匿名イベントを保存) |
| ホスティング | Vercel |

Supabase 未設定でもサイトは仮の文言とプレースホルダー写真で表示されます
(環境変数を設定すると管理画面・計測が有効になります)。

## セットアップ手順

### 1. Supabase プロジェクトの作成

1. https://supabase.com でプロジェクトを作成(サークル共通メールアドレス推奨)
2. **SQL Editor** で以下を順に実行
   1. `supabase/migrations/0001_init.sql`(テーブル・権限・Storage)
   2. `supabase/seed.sql`(初期コンテンツ。実行直後からサイトに表示されます)
3. **Authentication → Sign In / Up** で「Allow new users to sign up」を **OFF**
   (アカウントは管理画面から代表者が発行する招待制のため)

### 2. 環境変数

`.env.example` をコピーして `.env.local` を作成し、
Supabase の **Project Settings → API** の値を設定します。

```
NEXT_PUBLIC_SUPABASE_URL=      # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # anon public キー
SUPABASE_SERVICE_ROLE_KEY=     # service_role キー(サーバー専用)
NEXT_PUBLIC_SITE_URL=          # 公開URL(例 https://xxx.vercel.app)
```

### 3. 最初の代表者アカウント

1. Supabase の **Authentication → Users → Add user** でメールアドレスとパスワードを指定して作成
   (「Auto Confirm User」をON)
2. **SQL Editor** で代表者権限を付与:

```sql
update public.profiles set role = 'representative', display_name = '代表者名'
where id = (select id from auth.users where email = 'xxx@example.com');
```

3. `/admin/login` からログインし、以後のメンバー追加は管理画面の「ユーザー」から行えます

### 4. ローカル開発

```bash
npm install
npm run dev   # http://localhost:3000
```

### 5. Vercel へのデプロイ

1. Vercel(サークル共通アカウント推奨)でこのリポジトリをインポート
2. 環境変数4つを設定(`SUPABASE_SERVICE_ROLE_KEY` はサーバー専用のまま)
3. デプロイ後、`NEXT_PUBLIC_SITE_URL` を実際のURLに更新して再デプロイ

## 運用ガイド

### 権限

| 操作 | editor | representative |
|---|---|---|
| 文章・写真の編集、下書き保存 | ○ | ○ |
| 公開申請(公開待ちにする) | ○ | ○ |
| 公開・非公開・削除 | × | ○ |
| ユーザー管理 | × | ○ |

公開権限はサーバー(Server Actions)とデータベース(RLS・トリガー)の
両方でチェックされ、editor がAPIを直接叩いても公開はできません。

### コンテンツの状態

`下書き → 公開待ち → 公開中 ⇄ 非公開`

- 公開中のコンテンツを編集しても、代表者が「最新の下書きを公開」を押すまで公開側は変わりません
- 公開前の見た目は `/preview`(要ログイン)で確認できます

### 写真

- JPG / PNG / WebP、10MBまで。管理画面に用途ごとの推奨比率を表示
- 写真が未登録の枠は、用途名入りのプレースホルダーが同じサイズで表示されます
- 代替テキスト(alt)は必須です(アクセシビリティ・SEO)

### アクセス分析

- 匿名ID(ブラウザのlocalStorage)ベースの自前計測。IPアドレス等の個人情報は保存しません
- 管理画面「分析」で、訪問者数 / 閲覧数 / IGクリック率(最重要)/
  ボタン位置別クリック / 人気の活動 / 流入元 / デバイス比率を日別・週別・月別で確認できます
- プレビュー・管理画面の閲覧は計測されません

## 引き継ぎ(代表交代時)

1. Supabase / Vercel / GitHub をサークル共通アカウントで管理しておく(推奨)
2. 新代表のアカウントを管理画面「ユーザー」で representative として追加
3. 旧代表のアカウントを削除(代表者が0人になる操作はシステムが拒否します)

## セキュリティ上の注意

- `SUPABASE_SERVICE_ROLE_KEY` は絶対にクライアントへ渡さない・コミットしない
- 公開サインアップは無効。アカウント発行は代表者のみ
- 依存パッケージは定期的に `npm audit` を確認(Next.js 15系はビルド時依存の
  postcss / sharp に既知の勧告があり、修正は Next 16 へのメジャー更新が必要です)

## ディレクトリ構成(抜粋)

```
app/(public)/        # 公開ページ(トップ・活動詳細・プライバシーポリシー)
app/preview/         # 下書きプレビュー(要ログイン)
app/admin/           # 管理画面(ログイン・CMS・分析・ユーザー管理)
app/api/track/       # アクセス計測エンドポイント
components/public/   # 公開ページ用コンポーネント
components/admin/    # 管理画面用コンポーネント
lib/                 # Supabaseクライアント・Server Actions・型・検証
supabase/            # マイグレーションSQL・シードSQL
```
