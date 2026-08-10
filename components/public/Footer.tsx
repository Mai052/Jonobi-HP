import Link from "next/link";
import { SITE_NAME } from "@/lib/defaults";

export function Footer() {
  return (
    <footer className="border-t border-snow-200 bg-ainezu-900 pb-24 text-snow-100 md:pb-8">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <p className="text-sm font-bold">{SITE_NAME}</p>
        <p className="mt-1 text-xs text-ainezu-200">
          新潟県十日町市まつだいで活動する早稲田大学の学生サークル
        </p>
        <div className="mt-4 flex gap-4 text-xs">
          <Link href="/privacy" className="underline hover:text-white">
            プライバシーポリシー
          </Link>
        </div>
        <p className="mt-4 text-xs text-ainezu-400">
          &copy; {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>
    </footer>
  );
}
