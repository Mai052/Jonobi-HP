import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { trackEventSchema } from "@/lib/validation";

export const runtime = "nodejs";

const BOT_UA =
  /bot|crawler|spider|crawling|preview|lighthouse|headless|scraper|facebookexternalhit|slurp/i;

// ベストエフォートの簡易レートリミット(サーバーレスでは完全ではないが濫用の抑止になる)
const RATE_LIMIT = 120; // 1分あたり
const rateMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateMap.set(key, { count: 1, resetAt: now + 60_000 });
    if (rateMap.size > 10_000) rateMap.clear();
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  // 計測は失敗してもユーザー体験に影響させない: 常に 204 を返す
  try {
    const ua = request.headers.get("user-agent") ?? "";
    if (BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    if (isRateLimited(ip)) return new NextResponse(null, { status: 204 });

    const raw = await request.text();
    if (raw.length > 2000) return new NextResponse(null, { status: 204 });
    const parsed = trackEventSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return new NextResponse(null, { status: 204 });

    const event = parsed.data;
    // プレビュー・管理画面からのイベントは記録しない
    if (event.path.startsWith("/preview") || event.path.startsWith("/admin")) {
      return new NextResponse(null, { status: 204 });
    }

    const admin = createAdminClient();
    if (!admin) return new NextResponse(null, { status: 204 });

    // IPアドレスは保存しない(プライバシーポリシー参照)
    await admin.from("analytics_events").insert({
      event_type: event.type,
      path: event.path,
      activity_slug: event.activitySlug ?? null,
      cta_position: event.ctaPosition ?? null,
      session_id: event.sessionId,
      referrer: event.referrer ?? null,
      device: event.device ?? null,
    });
  } catch {
    // no-op
  }
  return new NextResponse(null, { status: 204 });
}
