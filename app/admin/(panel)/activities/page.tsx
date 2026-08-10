import Link from "next/link";
import { Notice } from "@/components/admin/Notice";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { createActivity, moveItem } from "@/lib/actions/content";
import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityContent, ContentStatus } from "@/lib/types";

const BACK = "/admin/activities";

export default async function AdminActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  await requireStaff();
  const { ok, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("activities")
    .select("id, slug, draft, published, status, sort_order")
    .order("sort_order");

  const activities = (rows ?? []) as {
    id: string;
    slug: string;
    draft: ActivityContent;
    published: ActivityContent | null;
    status: ContentStatus;
    sort_order: number;
  }[];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ainezu-900">活動の管理</h1>
      <Notice ok={ok} error={error} />

      <ul className="space-y-3">
        {activities.map((activity, index) => {
          const hasChanges =
            activity.status === "published" &&
            JSON.stringify(activity.draft) !==
              JSON.stringify(activity.published);
          return (
            <li
              key={activity.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-snow-200 bg-white p-4"
            >
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <form action={moveItem}>
                    <input type="hidden" name="table" value="activities" />
                    <input type="hidden" name="id" value={activity.id} />
                    <input type="hidden" name="dir" value="up" />
                    <input type="hidden" name="back" value={BACK} />
                    <button
                      type="submit"
                      disabled={index === 0}
                      aria-label="上に移動"
                      className="rounded bg-snow-100 px-2 text-xs disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveItem}>
                    <input type="hidden" name="table" value="activities" />
                    <input type="hidden" name="id" value={activity.id} />
                    <input type="hidden" name="dir" value="down" />
                    <input type="hidden" name="back" value={BACK} />
                    <button
                      type="submit"
                      disabled={index === activities.length - 1}
                      aria-label="下に移動"
                      className="rounded bg-snow-100 px-2 text-xs disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                </div>
                <div>
                  <p className="font-bold text-ainezu-900">
                    {activity.draft?.title ?? "(無題)"}
                  </p>
                  <p className="text-xs text-ainezu-400">/{activity.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge
                  status={activity.status}
                  hasUnpublishedChanges={hasChanges}
                />
                <Link
                  href={`/admin/activities/${activity.id}`}
                  className="rounded-full bg-forest-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-forest-700"
                >
                  編集
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <section className="rounded-2xl border border-snow-200 bg-white p-5">
        <h2 className="font-bold text-ainezu-900">活動を追加</h2>
        <form
          action={createActivity}
          className="mt-3 flex flex-wrap items-end gap-3"
        >
          <input type="hidden" name="back" value={BACK} />
          <label className="block text-sm">
            <span className="font-medium text-ainezu-700">活動名</span>
            <input
              type="text"
              name="title"
              required
              maxLength={50}
              className="mt-1 w-48 rounded-lg border border-snow-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ainezu-700">
              slug(URL用・半角英数)
            </span>
            <input
              type="text"
              name="slug"
              required
              pattern="[a-z0-9-]+"
              placeholder="例: camp"
              className="mt-1 w-48 rounded-lg border border-snow-300 px-3 py-2 text-sm"
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
    </div>
  );
}
