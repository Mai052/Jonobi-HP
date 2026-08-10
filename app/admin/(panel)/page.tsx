import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnalyticsReport } from "@/lib/types";

interface PendingItem {
  label: string;
  href: string;
}

export default async function AdminDashboardPage() {
  await requireStaff();
  const supabase = await createSupabaseServerClient();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [sectionsRes, activitiesRes, faqsRes, announcementsRes, photosRes, reportRes] =
    await Promise.all([
      supabase.from("sections").select("key, status").eq("status", "pending"),
      supabase.from("activities").select("id, draft, status").eq("status", "pending"),
      supabase.from("faqs").select("id, status").eq("status", "pending"),
      supabase.from("announcements").select("id, draft, status").eq("status", "pending"),
      supabase.from("photos").select("id, status").in("status", ["draft", "pending"]),
      supabase.rpc("analytics_report", {
        p_from: weekAgo.toISOString(),
        p_to: now.toISOString(),
        p_granularity: "day",
      }),
    ]);

  const pending: PendingItem[] = [
    ...(sectionsRes.data ?? []).map((s) => ({
      label: `基本文言(${s.key})`,
      href: "/admin/content",
    })),
    ...(activitiesRes.data ?? []).map((a) => ({
      label: `活動「${(a.draft as { title?: string })?.title ?? ""}」`,
      href: `/admin/activities/${a.id}`,
    })),
    ...(faqsRes.data ?? []).map(() => ({ label: "FAQ", href: "/admin/faq" })),
    ...(announcementsRes.data ?? []).map((a) => ({
      label: `お知らせ「${(a.draft as { title?: string })?.title ?? ""}」`,
      href: "/admin/announcements",
    })),
  ];
  const unpublishedPhotoCount = (photosRes.data ?? []).length;

  const report = (reportRes.data ?? null) as AnalyticsReport | null;
  const visitors = report?.summary.visitors ?? 0;
  const igSessions = report?.summary.ig_sessions ?? 0;
  const ctr = visitors > 0 ? ((igSessions / visitors) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-ainezu-900">ダッシュボード</h1>

      <section>
        <h2 className="text-sm font-bold text-ainezu-600">直近7日間</h2>
        <div className="mt-3 grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs text-ainezu-500">訪問者数</p>
            <p className="mt-1 text-2xl font-bold text-ainezu-900">
              {visitors}
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs text-ainezu-500">Instagramクリック</p>
            <p className="mt-1 text-2xl font-bold text-ainezu-900">
              {igSessions}
            </p>
          </div>
          <div className="rounded-2xl border-2 border-forest-200 bg-forest-50 p-4">
            <p className="text-xs font-bold text-forest-700">IGクリック率</p>
            <p className="mt-1 text-2xl font-bold text-forest-700">{ctr}%</p>
          </div>
        </div>
        <Link
          href="/admin/analytics"
          className="mt-2 inline-block text-xs font-bold text-forest-600 hover:underline"
        >
          詳しい分析を見る →
        </Link>
      </section>

      <section>
        <h2 className="text-sm font-bold text-ainezu-600">
          公開待ちのコンテンツ
        </h2>
        {pending.length === 0 && unpublishedPhotoCount === 0 ? (
          <p className="mt-3 rounded-2xl bg-white p-4 text-sm text-ainezu-500">
            公開待ちのコンテンツはありません
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {pending.map((item, index) => (
              <li key={index}>
                <Link
                  href={item.href}
                  className="block rounded-2xl bg-white p-4 text-sm font-medium text-ainezu-900 hover:bg-rice-100"
                >
                  {item.label}
                  <span className="ml-2 rounded-full bg-rice-200 px-2 py-0.5 text-xs">
                    公開待ち
                  </span>
                </Link>
              </li>
            ))}
            {unpublishedPhotoCount > 0 && (
              <li>
                <Link
                  href="/admin/photos"
                  className="block rounded-2xl bg-white p-4 text-sm font-medium text-ainezu-900 hover:bg-rice-100"
                >
                  未公開の写真が{unpublishedPhotoCount}枚あります
                </Link>
              </li>
            )}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold text-ainezu-600">クイックリンク</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/admin/content", label: "基本文言を編集" },
            { href: "/admin/photos", label: "写真を管理" },
            { href: "/admin/announcements", label: "お知らせを書く" },
            { href: "/preview", label: "プレビューを見る" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-2xl bg-white p-4 text-center text-sm font-bold text-forest-700 hover:bg-forest-50"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
