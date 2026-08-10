import Image from "next/image";
import type { PhotoView } from "@/lib/types";

interface SitePhotoProps {
  photo: PhotoView | null;
  /** 写真未登録時に表示する用途名(例: メインビジュアル) */
  label: string;
  /** aspect-* などのクラス。写真の有無に関わらず同じ枠を保ちレイアウト崩れを防ぐ */
  className?: string;
  sizes?: string;
  priority?: boolean;
  rounded?: boolean;
}

/**
 * 写真表示の共通コンポーネント。
 * 写真が未登録でも用途名入りのプレースホルダーを同じサイズで表示する。
 */
export function SitePhoto({
  photo,
  label,
  className = "",
  sizes = "100vw",
  priority = false,
  rounded = true,
}: SitePhotoProps) {
  const roundedClass = rounded ? "rounded-2xl" : "";

  if (!photo) {
    return (
      <div
        role="img"
        aria-label={`写真準備中: ${label}`}
        className={`relative flex items-center justify-center overflow-hidden border-2 border-dashed border-snow-300 bg-snow-100 ${roundedClass} ${className}`}
      >
        <div className="flex flex-col items-center gap-2 p-4 text-center text-ainezu-400">
          <svg
            aria-hidden="true"
            className="h-10 w-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0 0 21.75 19.5V4.5A1.5 1.5 0 0 0 20.25 3H3.75A1.5 1.5 0 0 0 2.25 4.5v15A1.5 1.5 0 0 0 3.75 21Z"
            />
          </svg>
          <span className="text-sm font-medium">写真: {label}</span>
          <span className="text-xs">(準備中)</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${roundedClass} ${className}`}>
      <Image
        src={photo.url}
        alt={photo.alt || label}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
      />
    </div>
  );
}
