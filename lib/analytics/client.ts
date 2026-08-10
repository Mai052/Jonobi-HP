"use client";

import type { CtaPosition } from "@/lib/types";

const SESSION_KEY = "jonnobi_sid";

function getSessionId(): string | null {
  try {
    let sid = window.localStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = window.crypto.randomUUID();
      window.localStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return null;
  }
}

interface TrackInput {
  type: "page_view" | "ig_click";
  activitySlug?: string;
  ctaPosition?: CtaPosition;
}

/** 匿名の計測イベントを送信する。失敗しても表示・遷移には影響させない */
export function track(input: TrackInput): void {
  try {
    const path = window.location.pathname;
    // プレビュー・管理画面は計測しない
    if (path.startsWith("/preview") || path.startsWith("/admin")) return;
    const sessionId = getSessionId();
    if (!sessionId) return;

    const payload = JSON.stringify({
      type: input.type,
      path,
      sessionId,
      activitySlug: input.activitySlug,
      ctaPosition: input.ctaPosition,
      referrer:
        input.type === "page_view" && document.referrer
          ? document.referrer.slice(0, 500)
          : undefined,
      device: window.innerWidth < 768 ? "mobile" : "desktop",
    });

    const blob = new Blob([payload], { type: "application/json" });
    if (!navigator.sendBeacon?.("/api/track", blob)) {
      fetch("/api/track", {
        method: "POST",
        body: payload,
        keepalive: true,
        headers: { "Content-Type": "application/json" },
      }).catch(() => {});
    }
  } catch {
    // no-op
  }
}
