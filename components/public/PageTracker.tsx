"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { track } from "@/lib/analytics/client";

/** ページ表示ごとに匿名の page_view イベントを送信する */
export function PageTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const match = pathname.match(/^\/activities\/([a-z0-9-]+)$/);
    track({
      type: "page_view",
      activitySlug: match ? match[1] : undefined,
    });
  }, [pathname]);

  return null;
}
