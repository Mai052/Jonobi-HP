import { Notice } from "@/components/admin/Notice";
import { PublishControls } from "@/components/admin/PublishControls";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { saveAnnouncement } from "@/lib/actions/content";
import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AnnouncementContent, ContentStatus } from "@/lib/types";

const BACK = "/admin/announcements";

export default async function AdminAnnouncementsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await requireStaff();
  const { ok, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("announcements")
    .select("id, draft, published, status, created_at")
    .order("created_at", { ascending: false });

  const announcements = (rows ?? []) as {
    id: string;
    draft: AnnouncementContent;
    published: AnnouncementContent | null;
    status: ContentStatus;
  }[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ainezu-900">
          お知らせ・次回活動の管理
        </h1>
        <p className="mt-1 text-xs text-ainezu-500">
          公開中の最新5件がトップページに表示されます。次回活動の告知には活動日を設定してください。
        </p>
      </div>
      <Notice ok={ok} error={error} />

      <section className="rounded-2xl border border-snow-200 bg-white p-5">
        <h2 className="font-bold text-ainezu-900">お知らせを追加</h2>
        <form action={saveAnnouncement} className="mt-3 space-y-3">
          <input type="hidden" name="back" value={BACK} />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="block text-sm">
              <span className="font-medium text-ainezu-700">タイトル</span>
              <input
                type="text"
                name="title"
                required
                maxLength={100}
                className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ainezu-700">
                活動日(任意)
              </span>
              <input
                type="date"
                name="event_date"
                className="mt-1 rounded-lg border border-snow-300 px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium text-ainezu-700">本文</span>
            <textarea
              name="body"
              required
              rows={3}
              className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-full bg-ainezu-700 px-5 py-2 text-xs font-bold text-white hover:bg-ainezu-900"
          >
            追加(下書き)
          </button>
        </form>
      </section>

      <ul className="space-y-4">
        {announcements.map((announcement) => {
          const hasChanges =
            announcement.status === "published" &&
            JSON.stringify(announcement.draft) !==
              JSON.stringify(announcement.published);
          return (
            <li
              key={announcement.id}
              className="rounded-2xl border border-snow-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-bold text-ainezu-900">
                  {announcement.draft?.title ?? "(無題)"}
                </h2>
                <StatusBadge
                  status={announcement.status}
                  hasUnpublishedChanges={hasChanges}
                />
              </div>
              <form action={saveAnnouncement} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={announcement.id} />
                <input type="hidden" name="back" value={BACK} />
                <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                  <label className="block text-sm">
                    <span className="font-medium text-ainezu-700">
                      タイトル
                    </span>
                    <input
                      type="text"
                      name="title"
                      defaultValue={announcement.draft?.title ?? ""}
                      required
                      maxLength={100}
                      className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-ainezu-700">
                      活動日(任意)
                    </span>
                    <input
                      type="date"
                      name="event_date"
                      defaultValue={announcement.draft?.event_date ?? ""}
                      className="mt-1 rounded-lg border border-snow-300 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="font-medium text-ainezu-700">本文</span>
                  <textarea
                    name="body"
                    defaultValue={announcement.draft?.body ?? ""}
                    required
                    rows={3}
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
              <div className="mt-3 border-t border-snow-100 pt-3">
                <PublishControls
                  table="announcements"
                  id={announcement.id}
                  status={announcement.status}
                  role={session.profile.role}
                  back={BACK}
                  canDelete
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
