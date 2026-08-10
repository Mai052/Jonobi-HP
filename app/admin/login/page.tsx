import type { Metadata } from "next";
import { SetupNotice } from "@/components/admin/SetupNotice";
import { login } from "@/lib/actions/auth";
import { SITE_NAME } from "@/lib/defaults";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "管理画面ログイン",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-snow-100 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-center text-xs font-bold text-forest-600">
          {SITE_NAME}
        </p>
        <h1 className="mt-1 text-center text-xl font-bold text-ainezu-900">
          管理画面ログイン
        </h1>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <form action={login} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-ainezu-700">メールアドレス</span>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ainezu-700">パスワード</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2.5 text-sm"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-forest-600 py-3 text-sm font-bold text-white hover:bg-forest-700"
          >
            ログイン
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-ainezu-500">
          アカウントは代表者が発行します
        </p>
      </div>
    </div>
  );
}
