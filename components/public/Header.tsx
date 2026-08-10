import Link from "next/link";
import { SITE_NAME } from "@/lib/defaults";
import { InstagramCta } from "./InstagramCta";

export function Header({ instagramUrl }: { instagramUrl: string }) {
  return (
    <header className="sticky top-0 z-50 border-b border-snow-200 bg-snow-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link
          href="/"
          className="text-sm font-bold leading-tight text-forest-700 sm:text-base"
        >
          {SITE_NAME}
        </Link>
        <InstagramCta
          href={instagramUrl}
          position="header"
          label="Instagramで聞く"
          variant="compact"
          className="shrink-0"
        />
      </div>
    </header>
  );
}
