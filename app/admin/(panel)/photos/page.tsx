import Image from "next/image";
import { Notice } from "@/components/admin/Notice";
import { PhotoUploadForm } from "@/components/admin/PhotoUploadForm";
import { PublishControls } from "@/components/admin/PublishControls";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { deletePhoto, movePhoto, updatePhotoAlt } from "@/lib/actions/photos";
import { requireStaff } from "@/lib/auth";
import { photoPublicUrl } from "@/lib/content";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActivityContent, PhotoRow, PhotoSlot } from "@/lib/types";

const BACK = "/admin/photos";

const SLOT_DEFS: {
  slot: PhotoSlot;
  label: string;
  ratio: string;
  note: string;
  perActivity?: boolean;
}[] = [
  {
    slot: "hero",
    label: "メインビジュアル",
    ratio: "16:9(横長)",
    note: "スマートフォンでは中央を基準に縦長(3:4)へトリミング表示されます。1枚目が使用されます。",
  },
  {
    slot: "about",
    label: "サークル紹介",
    ratio: "4:3",
    note: "サークル紹介セクションに表示。1枚目が使用されます。",
  },
  {
    slot: "members",
    label: "メンバー集合写真",
    ratio: "16:9(横長)",
    note: "ページ最下部のCTAセクションに表示。1枚目が使用されます。",
  },
  {
    slot: "activity_card",
    label: "活動カード",
    ratio: "4:3",
    note: "トップページの活動紹介カードに表示。活動ごとに1枚目が使用されます。",
    perActivity: true,
  },
  {
    slot: "activity_detail",
    label: "活動詳細",
    ratio: "4:3(1枚目は16:9でも可)",
    note: "活動詳細ページに表示。複数枚登録でき、並び順どおりに表示されます。",
    perActivity: true,
  },
];

export default async function AdminPhotosPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await requireStaff();
  const { ok, error } = await searchParams;
  const isRep = session.profile.role === "representative";

  const supabase = await createSupabaseServerClient();
  const [photosRes, activitiesRes] = await Promise.all([
    supabase
      .from("photos")
      .select(
        "id, slot, activity_id, storage_path, alt, sort_order, status, created_at"
      )
      .order("sort_order"),
    supabase
      .from("activities")
      .select("id, slug, draft")
      .order("sort_order"),
  ]);

  const photos = (photosRes.data ?? []) as PhotoRow[];
  const activities = (activitiesRes.data ?? []) as {
    id: string;
    slug: string;
    draft: ActivityContent;
  }[];
  const activityName = (id: string | null) =>
    activities.find((a) => a.id === id)?.draft?.title ?? "(不明な活動)";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ainezu-900">写真の管理</h1>
        <p className="mt-1 text-xs text-ainezu-500">
          JPG / PNG / WebP、10MBまで。アップロード後は代表者が「公開する」を押すとサイトに表示されます。
        </p>
      </div>
      <Notice ok={ok} error={error} />

      {/* アップロードフォーム */}
      <section className="rounded-2xl border border-snow-200 bg-white p-5">
        <h2 className="font-bold text-ainezu-900">写真をアップロード</h2>
        <div className="mt-3">
          <PhotoUploadForm
            slotOptions={SLOT_DEFS.map((def) => ({
              slot: def.slot,
              label: def.label,
              ratio: def.ratio,
            }))}
            activityOptions={activities.map((activity) => ({
              id: activity.id,
              title: activity.draft?.title ?? activity.slug,
            }))}
          />
        </div>
      </section>

      {/* 用途別の写真一覧 */}
      {SLOT_DEFS.map((def) => {
        const slotPhotos = photos.filter((p) => p.slot === def.slot);
        return (
          <section
            key={def.slot}
            className="rounded-2xl border border-snow-200 bg-white p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-bold text-ainezu-900">{def.label}</h2>
              <span className="text-xs text-ainezu-500">
                推奨比率: {def.ratio}
              </span>
            </div>
            <p className="mt-1 text-xs text-ainezu-500">{def.note}</p>
            {slotPhotos.length === 0 ? (
              <p className="mt-3 rounded-xl bg-snow-100 p-4 text-sm text-ainezu-500">
                まだ写真がありません(サイトにはプレースホルダーが表示されます)
              </p>
            ) : (
              <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {slotPhotos.map((photo, index) => (
                  <li
                    key={photo.id}
                    className="rounded-xl border border-snow-200 p-3"
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-snow-100">
                      <Image
                        src={photoPublicUrl(photo.storage_path)}
                        alt={photo.alt}
                        fill
                        sizes="300px"
                        className="object-cover"
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <StatusBadge status={photo.status} />
                      {def.perActivity && (
                        <span className="truncate text-xs text-ainezu-500">
                          {activityName(photo.activity_id)}
                        </span>
                      )}
                    </div>
                    <form action={updatePhotoAlt} className="mt-2 flex gap-2">
                      <input type="hidden" name="id" value={photo.id} />
                      <input type="hidden" name="back" value={BACK} />
                      <input
                        type="text"
                        name="alt"
                        defaultValue={photo.alt}
                        required
                        maxLength={200}
                        aria-label="代替テキスト"
                        className="w-full rounded-lg border border-snow-300 px-2 py-1 text-xs"
                      />
                      <button
                        type="submit"
                        className="shrink-0 rounded-full bg-ainezu-700 px-3 py-1 text-xs font-bold text-white"
                      >
                        保存
                      </button>
                    </form>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <form action={movePhoto} className="inline">
                        <input type="hidden" name="id" value={photo.id} />
                        <input type="hidden" name="dir" value="up" />
                        <input type="hidden" name="back" value={BACK} />
                        <button
                          type="submit"
                          disabled={index === 0}
                          aria-label="前に移動"
                          className="rounded bg-snow-100 px-2 py-0.5 text-xs disabled:opacity-30"
                        >
                          ↑
                        </button>
                      </form>
                      <form action={movePhoto} className="inline">
                        <input type="hidden" name="id" value={photo.id} />
                        <input type="hidden" name="dir" value="down" />
                        <input type="hidden" name="back" value={BACK} />
                        <button
                          type="submit"
                          disabled={index === slotPhotos.length - 1}
                          aria-label="後ろに移動"
                          className="rounded bg-snow-100 px-2 py-0.5 text-xs disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </form>
                      <PublishControls
                        table="photos"
                        id={photo.id}
                        status={photo.status}
                        role={session.profile.role}
                        back={BACK}
                      />
                      {isRep && (
                        <form action={deletePhoto} className="inline">
                          <input type="hidden" name="id" value={photo.id} />
                          <input type="hidden" name="back" value={BACK} />
                          <button
                            type="submit"
                            className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-100"
                          >
                            削除
                          </button>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
