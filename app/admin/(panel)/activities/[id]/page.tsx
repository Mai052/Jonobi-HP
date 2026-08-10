import Link from "next/link";
import { notFound } from "next/navigation";
import { Notice } from "@/components/admin/Notice";
import { PublishControls } from "@/components/admin/PublishControls";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { saveActivity } from "@/lib/actions/content";
import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityContent, ContentStatus } from "@/lib/types";

export default async function AdminActivityEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await requireStaff();
  const { id } = await params;
  const { ok, error } = await searchParams;
  const back = `/admin/activities/${id}`;

  const supabase = await createSupabaseServerClient();
  const { data: activity } = await supabase
    .from("activities")
    .select("id, slug, draft, published, status")
    .eq("id", id)
    .single();
  if (!activity) notFound();

  const draft = activity.draft as ActivityContent;
  const hasChanges =
    activity.status === "published" &&
    JSON.stringify(activity.draft) !== JSON.stringify(activity.published);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/admin/activities"
            className="text-xs text-ainezu-500 hover:underline"
          >
            ← 活動一覧へ戻る
          </Link>
          <h1 className="mt-1 text-xl font-bold text-ainezu-900">
            活動の編集: {draft?.title ?? ""}
          </h1>
        </div>
        <StatusBadge
          status={activity.status as ContentStatus}
          hasUnpublishedChanges={hasChanges}
        />
      </div>
      <Notice ok={ok} error={error} />

      <form
        action={saveActivity}
        className="space-y-4 rounded-2xl border border-snow-200 bg-white p-5"
      >
        <input type="hidden" name="id" value={activity.id} />
        <input type="hidden" name="back" value={back} />
        <label className="block text-sm">
          <span className="font-medium text-ainezu-700">活動名</span>
          <input
            type="text"
            name="title"
            defaultValue={draft?.title ?? ""}
            required
            maxLength={50}
            className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ainezu-700">
            概要(トップページのカードに表示)
          </span>
          <textarea
            name="summary"
            defaultValue={draft?.summary ?? ""}
            rows={3}
            required
            className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ainezu-700">
            本文(詳細ページに表示。空行で段落を分けられます)
          </span>
          <textarea
            name="body"
            defaultValue={draft?.body ?? ""}
            rows={10}
            required
            className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ainezu-700">
            時期の表示(例: 春〜秋、冬(12月〜3月))
          </span>
          <input
            type="text"
            name="season"
            defaultValue={draft?.season ?? ""}
            maxLength={50}
            className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-ainezu-700 px-5 py-2 text-xs font-bold text-white hover:bg-ainezu-900"
        >
          下書きを保存
        </button>
      </form>

      <div className="rounded-2xl border border-snow-200 bg-white p-5">
        <h2 className="text-sm font-bold text-ainezu-900">公開操作</h2>
        <div className="mt-3">
          <PublishControls
            table="activities"
            id={activity.id}
            status={activity.status as ContentStatus}
            role={session.profile.role}
            back={back}
            canDelete
          />
        </div>
        <p className="mt-3 text-xs text-ainezu-500">
          この活動の写真は
          <Link href="/admin/photos" className="mx-1 underline">
            写真管理
          </Link>
          から「活動カード」「活動詳細」の用途でアップロードできます。
          プレビュー:
          <a
            href={`/preview/activities/${activity.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 underline"
          >
            /preview/activities/{activity.slug}
          </a>
        </p>
      </div>
    </div>
  );
}
