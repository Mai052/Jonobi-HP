/** Supabase 未設定時に管理画面へ表示するセットアップ案内 */
export function SetupNotice() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-rice-300 bg-rice-100 p-6">
        <h1 className="text-lg font-bold text-ainezu-900">
          Supabase の初期設定が必要です
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ainezu-700">
          管理画面を使うには、Supabase プロジェクトを作成して環境変数を設定してください。
          手順はリポジトリの README.md に記載されています。
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-ainezu-700">
          <li>Supabase でプロジェクトを作成する</li>
          <li>
            SQL Editor で supabase/migrations/0001_init.sql と supabase/seed.sql
            を実行する
          </li>
          <li>
            環境変数 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY /
            SUPABASE_SERVICE_ROLE_KEY を設定する
          </li>
          <li>最初の代表者アカウントを作成する(README参照)</li>
        </ol>
        <p className="mt-4 text-xs text-ainezu-500">
          ※ 未設定の間も、公開サイトは仮の文言とプレースホルダー写真で表示されます。
        </p>
      </div>
    </div>
  );
}
