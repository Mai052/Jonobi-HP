import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/admin/SetupNotice";
import { logout } from "@/lib/actions/auth";
import { getStaffSession } from "@/lib/auth";
import { SITE_NAME } from "@/lib/defaults";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata = {
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { href: "/admin", label: "ダッシュボード" },
  { href: "/admin/content", label: "基本文言" },
  { href: "/admin/activities", label: "活動" },
  { href: "/admin/photos", label: "写真" },
  { href: "/admin/faq", label: "FAQ" },
  { href: "/admin/announcements", label: "お知らせ" },
  { href: "/admin/analytics", label: "分析" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) return <SetupNotice />;

  const session = await getStaffSession();
  if (!session) redirect("/admin/login");
  const isRep = session.profile.role === "representative";

  return (
    <div className="min-h-screen bg-snow-100">
      <header className="border-b border-snow-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link href="/admin" className="text-sm font-bold text-forest-700">
              {SITE_NAME} 管理画面
            </Link>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-ainezu-600">
                {session.profile.display_name || session.email}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-bold ${
                  isRep
                    ? "bg-forest-100 text-forest-700"
                    : "bg-snow-200 text-ainezu-700"
                }`}
              >
                {isRep ? "代表者" : "編集者"}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-ainezu-500 underline hover:text-ainezu-700"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
          <nav className="mt-2 flex flex-wrap gap-1 text-sm" aria-label="管理メニュー">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1.5 font-medium text-ainezu-700 hover:bg-snow-100"
              >
                {item.label}
              </Link>
            ))}
            {isRep && (
              <Link
                href="/admin/users"
                className="rounded-full px-3 py-1.5 font-medium text-ainezu-700 hover:bg-snow-100"
              >
                ユーザー
              </Link>
            )}
            <a
              href="/preview"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-3 py-1.5 font-medium text-rice-400 hover:bg-snow-100"
            >
              プレビュー ↗
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-3 py-1.5 font-medium text-forest-600 hover:bg-snow-100"
            >
              公開サイト ↗
            </a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
