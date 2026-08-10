import { Notice } from "@/components/admin/Notice";
import { PublishControls } from "@/components/admin/PublishControls";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { moveItem, saveFaq } from "@/lib/actions/content";
import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentStatus, FaqContent } from "@/lib/types";

const BACK = "/admin/faq";

export default async function AdminFaqPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await requireStaff();
  const { ok, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("faqs")
    .select("id, draft, published, status, sort_order")
    .order("sort_order");

  const faqs = (rows ?? []) as {
    id: string;
    draft: FaqContent;
    published: FaqContent | null;
    status: ContentStatus;
  }[];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ainezu-900">FAQの管理</h1>
      <Notice ok={ok} error={error} />

      <section className="rounded-2xl border border-snow-200 bg-white p-5">
        <h2 className="font-bold text-ainezu-900">FAQを追加</h2>
        <form action={saveFaq} className="mt-3 space-y-3">
          <input type="hidden" name="back" value={BACK} />
          <label className="block text-sm">
            <span className="font-medium text-ainezu-700">質問</span>
            <input
              type="text"
              name="question"
              required
              maxLength={300}
              className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ainezu-700">回答</span>
            <textarea
              name="answer"
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
        {faqs.map((faq, index) => {
          const hasChanges =
            faq.status === "published" &&
            JSON.stringify(faq.draft) !== JSON.stringify(faq.published);
          return (
            <li
              key={faq.id}
              className="rounded-2xl border border-snow-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <form action={moveItem} className="inline">
                    <input type="hidden" name="table" value="faqs" />
                    <input type="hidden" name="id" value={faq.id} />
                    <input type="hidden" name="dir" value="up" />
                    <input type="hidden" name="back" value={BACK} />
                    <button
                      type="submit"
                      disabled={index === 0}
                      aria-label="上に移動"
                      className="rounded bg-snow-100 px-2 py-0.5 text-xs disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveItem} className="inline">
                    <input type="hidden" name="table" value="faqs" />
                    <input type="hidden" name="id" value={faq.id} />
                    <input type="hidden" name="dir" value="down" />
                    <input type="hidden" name="back" value={BACK} />
                    <button
                      type="submit"
                      disabled={index === faqs.length - 1}
                      aria-label="下に移動"
                      className="rounded bg-snow-100 px-2 py-0.5 text-xs disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                  <span className="text-xs font-bold text-ainezu-400">
                    Q{index + 1}
                  </span>
                </div>
                <StatusBadge
                  status={faq.status}
                  hasUnpublishedChanges={hasChanges}
                />
              </div>
              <form action={saveFaq} className="mt-3 space-y-3">
                <input type="hidden" name="id" value={faq.id} />
                <input type="hidden" name="back" value={BACK} />
                <label className="block text-sm">
                  <span className="font-medium text-ainezu-700">質問</span>
                  <input
                    type="text"
                    name="question"
                    defaultValue={faq.draft?.question ?? ""}
                    required
                    maxLength={300}
                    className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-ainezu-700">回答</span>
                  <textarea
                    name="answer"
                    defaultValue={faq.draft?.answer ?? ""}
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
                  table="faqs"
                  id={faq.id}
                  status={faq.status}
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
