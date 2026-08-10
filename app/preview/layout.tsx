import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";
import { getStaffSession } from "@/lib/auth";
import { getSiteData } from "@/lib/content";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export default async function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured()) redirect("/admin");
  const session = await getStaffSession();
  if (!session) redirect("/admin/login");

  const { instagramUrl } = await getSiteData("preview");

  return (
    <>
      <div className="sticky top-0 z-[60] flex items-center justify-between gap-3 bg-rice-300 px-4 py-2 text-xs font-bold text-ainezu-900">
        <span>
          プレビュー(下書きの内容を表示中。一般公開はされていません)
        </span>
        <Link href="/admin" className="shrink-0 underline">
          管理画面へ戻る
        </Link>
      </div>
      <Header instagramUrl={instagramUrl} />
      <main>{children}</main>
      <Footer />
    </>
  );
}
