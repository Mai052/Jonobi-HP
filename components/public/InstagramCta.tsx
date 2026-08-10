"use client";

import { track } from "@/lib/analytics/client";
import type { CtaPosition } from "@/lib/types";

interface InstagramCtaProps {
  href: string;
  position: CtaPosition;
  label?: string;
  variant?: "primary" | "compact" | "sticky";
  className?: string;
}

function InstagramIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311 1.266-.058 1.646-.07 4.85-.07M12 0C8.741 0 8.332.014 7.052.072 5.197.157 3.355.673 2.014 2.014.673 3.355.157 5.197.072 7.052.014 8.332 0 8.741 0 12s.014 3.668.072 4.948c.085 1.855.601 3.697 1.942 5.038 1.341 1.341 3.183 1.857 5.038 1.942C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.855-.085 3.697-.601 5.038-1.942 1.341-1.341 1.857-3.183 1.942-5.038.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.085-1.855-.601-3.697-1.942-5.038C20.645.673 18.803.157 16.948.072 15.668.014 15.259 0 12 0Z" />
      <path d="M12 5.838A6.162 6.162 0 1 0 18.162 12 6.162 6.162 0 0 0 12 5.838Zm0 10.162A4 4 0 1 1 16 12a4 4 0 0 1-4 4Z" />
      <circle cx="18.406" cy="5.594" r="1.44" />
    </svg>
  );
}

/**
 * Instagram誘導ボタン(全CTA共通)。
 * クリック時に設置位置つきの計測イベントを送信してから遷移する。
 */
export function InstagramCta({
  href,
  position,
  label = "Instagramで活動について聞く",
  variant = "primary",
  className = "",
}: InstagramCtaProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold transition-colors";
  const variantClass =
    variant === "compact"
      ? "rounded-full bg-forest-600 px-4 py-2 text-sm text-white hover:bg-forest-700"
      : variant === "sticky"
        ? "w-full rounded-full bg-forest-600 px-6 py-3.5 text-base text-white shadow-lg hover:bg-forest-700"
        : "rounded-full bg-forest-600 px-8 py-4 text-base text-white shadow-md hover:bg-forest-700";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => track({ type: "ig_click", ctaPosition: position })}
      className={`${base} ${variantClass} ${className}`}
    >
      <InstagramIcon />
      <span>{label}</span>
    </a>
  );
}
