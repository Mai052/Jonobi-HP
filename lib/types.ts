export type ContentStatus = "draft" | "pending" | "published" | "unpublished";
export type Role = "editor" | "representative";
export type SectionKey = "hero" | "about" | "join_info" | "settings";
export type PhotoSlot =
  | "hero"
  | "about"
  | "members"
  | "activity_card"
  | "activity_detail";
export type CtaPosition =
  | "header"
  | "hero"
  | "after_activity"
  | "footer"
  | "sticky";
export type ContentTable = "sections" | "activities" | "faqs" | "announcements";

export interface HeroContent {
  catchcopy: string;
  description: string;
}

export interface AboutContent {
  purpose: string;
  relation: string;
  features: string;
}

export interface JoinInfoContent {
  seasons: string;
  duration: string;
  location: string;
  cost: string;
  frequency: string;
  attendance: string;
  beginners: string;
}

export interface SettingsContent {
  instagram_url: string;
}

export interface ActivityContent {
  title: string;
  summary: string;
  body: string;
  season: string;
}

export interface FaqContent {
  question: string;
  answer: string;
}

export interface AnnouncementContent {
  title: string;
  body: string;
  event_date: string; // 'YYYY-MM-DD' または ''
}

/* ---------- DBの行 ---------- */

export interface ContentRow<T> {
  id: string;
  draft: T;
  published: T | null;
  status: ContentStatus;
  sort_order?: number;
  updated_at: string;
}

export interface SectionRow<T = Record<string, string>> extends ContentRow<T> {
  key: SectionKey;
}

export interface ActivityRow extends ContentRow<ActivityContent> {
  slug: string;
  sort_order: number;
}

export interface PhotoRow {
  id: string;
  slot: PhotoSlot;
  activity_id: string | null;
  storage_path: string;
  alt: string;
  sort_order: number;
  status: ContentStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string;
  role: Role;
  created_at: string;
}

/* ---------- 表示用データ ---------- */

export interface PhotoView {
  id: string;
  url: string;
  alt: string;
}

export interface ActivityView extends ActivityContent {
  slug: string;
  cardPhoto: PhotoView | null;
  detailPhotos: PhotoView[];
}

export interface AnnouncementView extends AnnouncementContent {
  id: string;
}

export interface SiteData {
  hero: HeroContent;
  about: AboutContent;
  joinInfo: JoinInfoContent;
  instagramUrl: string;
  activities: ActivityView[];
  faqs: FaqContent[];
  announcements: AnnouncementView[];
  heroPhoto: PhotoView | null;
  aboutPhoto: PhotoView | null;
  membersPhoto: PhotoView | null;
}

/* ---------- 分析 ---------- */

export type Granularity = "day" | "week" | "month";

export interface AnalyticsReport {
  summary: {
    visitors: number;
    pageviews: number;
    ig_clicks: number;
    ig_sessions: number;
  };
  timeseries: {
    bucket: string;
    visitors: number;
    pageviews: number;
    ig_sessions: number;
  }[];
  positions: { position: CtaPosition; clicks: number }[];
  activities: { slug: string; views: number }[];
  referrers: { source: string; sessions: number }[];
  devices: { device: "mobile" | "desktop"; sessions: number }[];
}
