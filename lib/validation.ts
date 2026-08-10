import { z } from "zod";

const text = (max: number) => z.string().trim().max(max, `${max}文字以内で入力してください`);
const requiredText = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "入力してください")
    .max(max, `${max}文字以内で入力してください`);

export const heroSchema = z.object({
  catchcopy: requiredText(100),
  description: requiredText(300),
});

export const aboutSchema = z.object({
  purpose: requiredText(2000),
  relation: requiredText(2000),
  features: requiredText(2000),
});

export const joinInfoSchema = z.object({
  seasons: requiredText(1000),
  duration: requiredText(500),
  location: requiredText(500),
  cost: requiredText(500),
  frequency: requiredText(500),
  attendance: requiredText(500),
  beginners: requiredText(500),
});

// オープンリダイレクト防止のため Instagram のURLのみ許可
export const settingsSchema = z.object({
  instagram_url: z
    .string()
    .trim()
    .url("URLの形式が正しくありません")
    .refine(
      (url) =>
        url.startsWith("https://www.instagram.com/") ||
        url.startsWith("https://instagram.com/"),
      "InstagramのURL(https://www.instagram.com/...)を入力してください"
    ),
});

export const sectionSchemas = {
  hero: heroSchema,
  about: aboutSchema,
  join_info: joinInfoSchema,
  settings: settingsSchema,
} as const;

export const activitySchema = z.object({
  title: requiredText(50),
  summary: requiredText(300),
  body: requiredText(5000),
  season: text(50),
});

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-]+$/, "slugは半角英小文字・数字・ハイフンのみ使用できます");

export const faqSchema = z.object({
  question: requiredText(300),
  answer: requiredText(2000),
});

export const announcementSchema = z.object({
  title: requiredText(100),
  body: requiredText(2000),
  event_date: z
    .string()
    .trim()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "日付の形式が正しくありません"),
});

export const photoAltSchema = requiredText(200);

export const contentTables = [
  "sections",
  "activities",
  "faqs",
  "announcements",
] as const;

export const publishableTables = [...contentTables, "photos"] as const;

export const trackEventSchema = z.object({
  type: z.enum(["page_view", "ig_click"]),
  path: z.string().startsWith("/").max(200),
  sessionId: z.string().uuid(),
  activitySlug: z
    .string()
    .regex(/^[a-z0-9-]{1,50}$/)
    .optional(),
  ctaPosition: z
    .enum(["header", "hero", "after_activity", "footer", "sticky"])
    .optional(),
  referrer: z.string().max(500).optional(),
  device: z.enum(["mobile", "desktop"]).optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().trim().email("メールアドレスの形式が正しくありません"),
  display_name: requiredText(50),
  role: z.enum(["editor", "representative"]),
});

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
