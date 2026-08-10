import Link from "next/link";
import { SITE_NAME } from "@/lib/defaults";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-forest-600">404</p>
      <h1 className="mt-4 text-xl font-bold text-ainezu-900">
        ページが見つかりませんでした
      </h1>
      <p className="mt-2 text-sm text-ainezu-600">
        お探しのページは移動または削除された可能性があります。
      </p>
      <Link
        href="/"
        className="mt-6 rounded-full bg-forest-600 px-6 py-3 text-sm font-bold text-white hover:bg-forest-700"
      >
        {SITE_NAME} トップへ戻る
      </Link>
    </div>
  );
}
