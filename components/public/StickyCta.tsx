"use client";

import { useEffect, useState } from "react";
import { InstagramCta } from "./InstagramCta";

/**
 * スマートフォン専用の画面下固定CTA。
 * ファーストビュー内ではヒーローのボタンと重複するため、スクロール後に表示する。
 */
export function StickyCta({ instagramUrl }: { instagramUrl: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <InstagramCta
        href={instagramUrl}
        position="sticky"
        variant="sticky"
        className={visible ? "" : "pointer-events-none"}
      />
    </div>
  );
}
