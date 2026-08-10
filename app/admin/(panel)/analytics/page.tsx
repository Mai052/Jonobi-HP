import Link from "next/link";
import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ActivityContent,
  AnalyticsReport,
  Granularity,
} from "@/lib/types";

const POSITION_LABELS: Record<string, string> = {
  header: "ヘッダー",
  hero: "ファーストビュー",
  after_activity: "活動紹介を読んだ後",
  footer: "ページ最下部",
  sticky: "スマホ固定ボタン",
};

const GRANULARITY_DEFS: Record<
  Granularity,
  { label: string; rangeLabel: string; days: number }
> = {
  day: { label: "日別", rangeLabel: "直近14日間", days: 14 },
  week: { label: "週別", rangeLabel: "直近12週間", days: 84 },
  month: { label: "月別", rangeLabel: "直近12か月", days: 365 },
};

function formatBucket(bucket: string, granularity: Granularity): string {
  const [, m, d] = bucket.split("-");
  if (granularity === "month") return `${Number(m)}月`;
  if (granularity === "week") return `${Number(m)}/${Number(d)}週`;
  return `${Number(m)}/${Number(d)}`;
}

function HorizontalBars({
  items,
  unit,
}: {
  items: { label: string; value: number }[];
  unit: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-ainezu-500">まだデータがありません</p>;
  }
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.label} className="text-xs">
          <div className="flex justify-between gap-2">
            <span className="truncate font-medium text-ainezu-700">
              {item.label}
            </span>
            <span className="shrink-0 text-ainezu-500">
              {item.value}
              {unit}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-snow-100">
            <div
              className="h-2 rounded-full bg-forest-500"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ g?: string }>;
}) {
  await requireStaff();
  const { g } = await searchParams;
  const granularity: Granularity =
    g === "week" || g === "month" ? g : "day";
  const def = GRANULARITY_DEFS[granularity];

  const now = new Date();
  const from = new Date(now.getTime() - def.days * 24 * 60 * 60 * 1000);

  const supabase = await createSupabaseServerClient();
  const [reportRes, activitiesRes] = await Promise.all([
    supabase.rpc("analytics_report", {
      p_from: from.toISOString(),
      p_to: now.toISOString(),
      p_granularity: granularity,
    }),
    supabase.from("activities").select("slug, draft"),
  ]);

  if (reportRes.error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        分析データを取得できませんでした: {reportRes.error.message}
      </div>
    );
  }

  const report = reportRes.data as AnalyticsReport;
  const activityTitles = new Map(
    ((activitiesRes.data ?? []) as { slug: string; draft: ActivityContent }[]).map(
      (a) => [a.slug, a.draft?.title ?? a.slug]
    )
  );

  const { visitors, pageviews, ig_clicks, ig_sessions } = report.summary;
  const ctr = visitors > 0 ? (ig_sessions / visitors) * 100 : 0;
  const maxTimeseries = Math.max(
    ...report.timeseries.map((t) => t.pageviews),
    1
  );
  const totalDeviceSessions = report.devices.reduce(
    (sum, d) => sum + d.sessions,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ainezu-900">アクセス分析</h1>
        <nav className="flex gap-1 rounded-full bg-white p-1" aria-label="集計単位">
          {(Object.keys(GRANULARITY_DEFS) as Granularity[]).map((key) => (
            <Link
              key={key}
              href={`/admin/analytics?g=${key}`}
              className={`rounded-full px-4 py-1.5 text-xs font-bold ${
                key === granularity
                  ? "bg-forest-600 text-white"
                  : "text-ainezu-600 hover:bg-snow-100"
              }`}
            >
              {GRANULARITY_DEFS[key].label}
            </Link>
          ))}
        </nav>
      </div>
      <p className="text-xs text-ainezu-500">集計期間: {def.rangeLabel}</p>

      {/* 最重要指標 */}
      <section className="rounded-2xl border-2 border-forest-200 bg-forest-50 p-6">
        <p className="text-sm font-bold text-forest-700">
          Instagramクリック率(最重要指標)
        </p>
        <p className="mt-1 text-4xl font-bold text-forest-700">
          {ctr.toFixed(1)}
          <span className="text-lg">%</span>
        </p>
        <p className="mt-1 text-xs text-ainezu-600">
          Instagramをクリックした人数({ig_sessions}人) ÷ 訪問者数({visitors}
          人) × 100
        </p>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs text-ainezu-500">訪問者数</p>
          <p className="mt-1 text-2xl font-bold text-ainezu-900">{visitors}</p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs text-ainezu-500">ページ閲覧数</p>
          <p className="mt-1 text-2xl font-bold text-ainezu-900">{pageviews}</p>
        </div>
        <div className="rounded-2xl bg-white p-4">
          <p className="text-xs text-ainezu-500">IGクリック数(延べ)</p>
          <p className="mt-1 text-2xl font-bold text-ainezu-900">{ig_clicks}</p>
        </div>
      </section>

      {/* 推移 */}
      <section className="rounded-2xl bg-white p-5">
        <h2 className="text-sm font-bold text-ainezu-900">
          訪問者数・閲覧数の推移
        </h2>
        {report.timeseries.length === 0 ? (
          <p className="mt-3 text-sm text-ainezu-500">
            まだデータがありません
          </p>
        ) : (
          <>
            <div
              className="mt-4 flex items-end gap-1 overflow-x-auto"
              style={{ height: 160 }}
            >
              {report.timeseries.map((t) => (
                <div
                  key={t.bucket}
                  className="flex min-w-8 flex-1 flex-col items-center justify-end gap-1"
                  title={`${t.bucket}: 訪問者${t.visitors} / 閲覧${t.pageviews} / IG${t.ig_sessions}`}
                >
                  <div
                    className="w-full rounded-t bg-forest-200"
                    style={{
                      height: `${(t.pageviews / maxTimeseries) * 130}px`,
                    }}
                  >
                    <div
                      className="w-full rounded-t bg-forest-600"
                      style={{
                        height: `${
                          t.pageviews > 0
                            ? (t.visitors / t.pageviews) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-ainezu-500">
                    {formatBucket(t.bucket, granularity)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-ainezu-500">
              ■ 濃い緑 = 訪問者数 / 薄い緑 = ページ閲覧数
            </p>
          </>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {/* CTA位置別クリック */}
        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-sm font-bold text-ainezu-900">
            どの位置のInstagramボタンが押されたか
          </h2>
          <div className="mt-4">
            <HorizontalBars
              items={report.positions.map((p) => ({
                label: POSITION_LABELS[p.position] ?? p.position,
                value: p.clicks,
              }))}
              unit="回"
            />
          </div>
        </section>

        {/* よく見られている活動 */}
        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-sm font-bold text-ainezu-900">
            よく見られている活動
          </h2>
          <div className="mt-4">
            <HorizontalBars
              items={report.activities.map((a) => ({
                label: activityTitles.get(a.slug) ?? a.slug,
                value: a.views,
              }))}
              unit="回"
            />
          </div>
        </section>

        {/* 流入元 */}
        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-sm font-bold text-ainezu-900">流入元</h2>
          <div className="mt-4">
            <HorizontalBars
              items={report.referrers.map((r) => ({
                label: r.source,
                value: r.sessions,
              }))}
              unit="人"
            />
          </div>
        </section>

        {/* デバイス比率 */}
        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-sm font-bold text-ainezu-900">
            スマートフォンとPCの比率
          </h2>
          <div className="mt-4">
            <HorizontalBars
              items={report.devices.map((d) => ({
                label: `${d.device === "mobile" ? "スマートフォン" : "PC"}(${
                  totalDeviceSessions > 0
                    ? Math.round((d.sessions / totalDeviceSessions) * 100)
                    : 0
                }%)`,
                value: d.sessions,
              }))}
              unit="人"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
