import {
  defaultAbout,
  defaultActivities,
  defaultAnnouncements,
  defaultFaqs,
  defaultHero,
  defaultJoinInfo,
  DEFAULT_INSTAGRAM_URL,
} from "./defaults";
import { createPublicClient } from "./supabase/public";
import { createSupabaseServerClient } from "./supabase/server";
import { isSupabaseConfigured, supabaseUrl } from "./supabase/env";
import type {
  AboutContent,
  ActivityContent,
  ActivityView,
  AnnouncementContent,
  FaqContent,
  HeroContent,
  JoinInfoContent,
  PhotoRow,
  PhotoView,
  SettingsContent,
  SiteData,
} from "./types";

export type ContentMode = "published" | "preview";

export function photoPublicUrl(storagePath: string): string {
  return `${supabaseUrl}/storage/v1/object/public/photos/${storagePath}`;
}

function toPhotoView(row: PhotoRow): PhotoView {
  return { id: row.id, url: photoPublicUrl(row.storage_path), alt: row.alt };
}

/**
 * サイト表示用データを取得する。
 * - published: 公開ページ用。匿名クライアント(RLSで公開中のみ)。Cookie不使用のため静的生成可。
 * - preview: プレビュー用。ログインセッションで下書き(draft)を取得。
 * Supabase 未設定・取得失敗時はデフォルト文言にフォールバックする。
 */
export async function getSiteData(
  mode: ContentMode = "published"
): Promise<SiteData> {
  const fallback: SiteData = {
    hero: defaultHero,
    about: defaultAbout,
    joinInfo: defaultJoinInfo,
    instagramUrl: DEFAULT_INSTAGRAM_URL,
    activities: defaultActivities,
    faqs: defaultFaqs,
    announcements: defaultAnnouncements,
    heroPhoto: null,
    aboutPhoto: null,
    membersPhoto: null,
  };

  if (!isSupabaseConfigured()) return fallback;

  try {
    const supabase =
      mode === "preview"
        ? await createSupabaseServerClient()
        : createPublicClient();
    if (!supabase) return fallback;

    const contentColumn = mode === "preview" ? "draft" : "published";
    // プレビューは「非公開以外」を表示、公開ページは「公開中」のみ(RLSでも二重に制限)
    const visibleStatuses =
      mode === "preview" ? ["draft", "pending", "published"] : ["published"];

    const [sectionsRes, activitiesRes, faqsRes, announcementsRes, photosRes] =
      await Promise.all([
        supabase
          .from("sections")
          .select(`key, content:${contentColumn}`)
          .in("status", visibleStatuses),
        supabase
          .from("activities")
          .select(`id, slug, content:${contentColumn}`)
          .in("status", visibleStatuses)
          .order("sort_order"),
        supabase
          .from("faqs")
          .select(`content:${contentColumn}`)
          .in("status", visibleStatuses)
          .order("sort_order"),
        supabase
          .from("announcements")
          .select(`id, content:${contentColumn}`)
          .in("status", visibleStatuses)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("photos")
          .select(
            "id, slot, activity_id, storage_path, alt, sort_order, status, created_at"
          )
          .in("status", visibleStatuses)
          .order("sort_order"),
      ]);

    const sections = new Map<string, Record<string, string>>();
    for (const row of sectionsRes.data ?? []) {
      const r = row as unknown as {
        key: string;
        content: Record<string, string>;
      };
      if (r.content) sections.set(r.key, r.content);
    }

    const photos = (photosRes.data ?? []) as PhotoRow[];
    const firstPhoto = (slot: string): PhotoView | null => {
      const p = photos.find((x) => x.slot === slot);
      return p ? toPhotoView(p) : null;
    };

    const activityRows = (activitiesRes.data ?? []) as unknown as {
      id: string;
      slug: string;
      content: ActivityContent;
    }[];
    const activities: ActivityView[] =
      activityRows.length > 0
        ? activityRows
            .filter((a) => a.content?.title)
            .map((a) => ({
              ...a.content,
              slug: a.slug,
              cardPhoto:
                photos
                  .filter(
                    (p) => p.slot === "activity_card" && p.activity_id === a.id
                  )
                  .map(toPhotoView)[0] ?? null,
              detailPhotos: photos
                .filter(
                  (p) => p.slot === "activity_detail" && p.activity_id === a.id
                )
                .map(toPhotoView),
            }))
        : defaultActivities;

    const faqRows = (faqsRes.data ?? []) as unknown as {
      content: FaqContent;
    }[];
    const announcementRows = (announcementsRes.data ?? []) as unknown as {
      id: string;
      content: AnnouncementContent;
    }[];

    const settings = sections.get("settings") as SettingsContent | undefined;

    return {
      hero: (sections.get("hero") as unknown as HeroContent) ?? defaultHero,
      about: (sections.get("about") as unknown as AboutContent) ?? defaultAbout,
      joinInfo:
        (sections.get("join_info") as unknown as JoinInfoContent) ??
        defaultJoinInfo,
      instagramUrl: settings?.instagram_url || DEFAULT_INSTAGRAM_URL,
      activities,
      faqs:
        faqRows.length > 0
          ? faqRows.map((f) => f.content).filter((f) => f?.question)
          : defaultFaqs,
      announcements:
        announcementRows.length > 0
          ? announcementRows
              .filter((a) => a.content?.title)
              .map((a) => ({ ...a.content, id: a.id }))
          : defaultAnnouncements,
      heroPhoto: firstPhoto("hero"),
      aboutPhoto: firstPhoto("about"),
      membersPhoto: firstPhoto("members"),
    };
  } catch {
    return fallback;
  }
}
