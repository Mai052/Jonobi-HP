import { Notice } from "@/components/admin/Notice";
import { PublishControls } from "@/components/admin/PublishControls";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { saveSection } from "@/lib/actions/content";
import { requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ContentStatus, SectionKey } from "@/lib/types";

const BACK = "/admin/content";

interface FieldDef {
  name: string;
  label: string;
  type: "input" | "textarea";
  hint?: string;
}

const SECTION_DEFS: {
  key: SectionKey;
  title: string;
  description: string;
  fields: FieldDef[];
}[] = [
  {
    key: "hero",
    title: "ファーストビュー",
    description: "トップページ最上部のキャッチコピーと補足説明",
    fields: [
      { name: "catchcopy", label: "キャッチコピー", type: "input" },
      { name: "description", label: "補足説明", type: "textarea" },
    ],
  },
  {
    key: "about",
    title: "サークル紹介",
    description: "活動目的・まつだい地域との関係・団体の特徴",
    fields: [
      { name: "purpose", label: "活動の目的", type: "textarea" },
      { name: "relation", label: "まつだい地域との関係", type: "textarea" },
      { name: "features", label: "団体の特徴", type: "textarea" },
    ],
  },
  {
    key: "join_info",
    title: "活動頻度・参加方法",
    description: "新入生の不安を解消するセクション",
    fields: [
      { name: "seasons", label: "年間の活動時期", type: "textarea" },
      { name: "duration", label: "1回の活動期間", type: "textarea" },
      { name: "location", label: "活動場所", type: "textarea" },
      { name: "cost", label: "費用", type: "textarea" },
      { name: "frequency", label: "参加頻度", type: "textarea" },
      { name: "attendance", label: "毎回参加は必要か", type: "textarea" },
      { name: "beginners", label: "未経験者でも参加できるか", type: "textarea" },
    ],
  },
  {
    key: "settings",
    title: "Instagram設定",
    description: "全CTAボタンの遷移先URL",
    fields: [
      {
        name: "instagram_url",
        label: "InstagramのURL",
        type: "input",
        hint: "https://www.instagram.com/ で始まるURLのみ設定できます",
      },
    ],
  },
];

export default async function AdminContentPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await requireStaff();
  const { ok, error } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("sections")
    .select("id, key, draft, published, status");

  const sections = new Map(
    (rows ?? []).map((r) => [
      r.key as SectionKey,
      r as {
        id: string;
        key: SectionKey;
        draft: Record<string, string>;
        published: Record<string, string> | null;
        status: ContentStatus;
      },
    ])
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-ainezu-900">基本文言の編集</h1>
      <Notice ok={ok} error={error} />
      {SECTION_DEFS.map((def) => {
        const row = sections.get(def.key);
        const draft = row?.draft ?? {};
        const hasChanges =
          row?.status === "published" &&
          JSON.stringify(row.draft) !== JSON.stringify(row.published);

        return (
          <section
            key={def.key}
            className="rounded-2xl border border-snow-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-bold text-ainezu-900">{def.title}</h2>
                <p className="text-xs text-ainezu-500">{def.description}</p>
              </div>
              <StatusBadge
                status={row?.status ?? "draft"}
                hasUnpublishedChanges={hasChanges}
              />
            </div>
            <form action={saveSection} className="mt-4 space-y-4">
              <input type="hidden" name="key" value={def.key} />
              <input type="hidden" name="back" value={BACK} />
              {def.fields.map((field) => (
                <label key={field.name} className="block text-sm">
                  <span className="font-medium text-ainezu-700">
                    {field.label}
                  </span>
                  {field.hint && (
                    <span className="ml-2 text-xs text-ainezu-400">
                      {field.hint}
                    </span>
                  )}
                  {field.type === "textarea" ? (
                    <textarea
                      name={field.name}
                      defaultValue={draft[field.name] ?? ""}
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      name={field.name}
                      defaultValue={draft[field.name] ?? ""}
                      className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
                    />
                  )}
                </label>
              ))}
              <button
                type="submit"
                className="rounded-full bg-ainezu-700 px-5 py-2 text-xs font-bold text-white hover:bg-ainezu-900"
              >
                下書きを保存
              </button>
            </form>
            {row && (
              <div className="mt-3 border-t border-snow-100 pt-3">
                <PublishControls
                  table="sections"
                  id={row.id}
                  status={row.status}
                  role={session.profile.role}
                  back={BACK}
                />
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
