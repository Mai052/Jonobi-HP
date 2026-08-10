"use server";

import { redirect } from "next/navigation";
import { requireRepresentative, requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  activitySchema,
  announcementSchema,
  contentTables,
  faqSchema,
  sectionSchemas,
  slugSchema,
} from "@/lib/validation";
import type { SectionKey } from "@/lib/types";
import { errorMessage, resultUrl, safeBack } from "./helpers";

type Result = { ok?: string; error?: string };

async function finish(back: string, result: Result): Promise<never> {
  redirect(resultUrl(back, result));
}

function formText(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "");
}

/* ---------------- 固定セクション ---------------- */

export async function saveSection(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: Result;
  try {
    const session = await requireStaff();
    const key = formText(formData, "key") as SectionKey;
    const schema = sectionSchemas[key];
    if (!schema) throw new Error("不正なセクションです");

    const raw: Record<string, string> = {};
    for (const field of Object.keys(schema.shape)) {
      raw[field] = formText(formData, field);
    }
    const draft = schema.parse(raw);

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("sections")
      .upsert(
        {
          key,
          draft,
          updated_by: session.userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    if (error) throw new Error(error.message);
    result = { ok: "下書きを保存しました" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  await finish(back, result);
}

/* ---------------- 活動 ---------------- */

export async function saveActivity(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: Result;
  try {
    const session = await requireStaff();
    const id = formText(formData, "id");
    const draft = activitySchema.parse({
      title: formText(formData, "title"),
      summary: formText(formData, "summary"),
      body: formText(formData, "body"),
      season: formText(formData, "season"),
    });
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("activities")
      .update({
        draft,
        updated_by: session.userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) throw new Error(error.message);
    result = { ok: "下書きを保存しました" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  await finish(back, result);
}

export async function createActivity(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: Result;
  try {
    const session = await requireStaff();
    const title = formText(formData, "title").trim();
    const slug = slugSchema.parse(formText(formData, "slug"));
    if (!title) throw new Error("活動名を入力してください");

    const supabase = await createSupabaseServerClient();
    const { count } = await supabase
      .from("activities")
      .select("id", { count: "exact", head: true });
    const { error } = await supabase.from("activities").insert({
      slug,
      draft: {
        title,
        summary: "(準備中)",
        body: "(準備中)",
        season: "",
      },
      status: "draft",
      sort_order: (count ?? 0) + 1,
      updated_by: session.userId,
    });
    if (error) throw new Error(error.message);
    result = { ok: "活動を追加しました(下書き)" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  await finish(back, result);
}

/* ---------------- FAQ ---------------- */

export async function saveFaq(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: Result;
  try {
    const session = await requireStaff();
    const id = formText(formData, "id");
    const draft = faqSchema.parse({
      question: formText(formData, "question"),
      answer: formText(formData, "answer"),
    });
    const supabase = await createSupabaseServerClient();
    if (id) {
      const { error } = await supabase
        .from("faqs")
        .update({
          draft,
          updated_by: session.userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
      result = { ok: "下書きを保存しました" };
    } else {
      const { count } = await supabase
        .from("faqs")
        .select("id", { count: "exact", head: true });
      const { error } = await supabase.from("faqs").insert({
        draft,
        status: "draft",
        sort_order: (count ?? 0) + 1,
        updated_by: session.userId,
      });
      if (error) throw new Error(error.message);
      result = { ok: "FAQを追加しました(下書き)" };
    }
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  await finish(back, result);
}

/* ---------------- お知らせ ---------------- */

export async function saveAnnouncement(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: Result;
  try {
    const session = await requireStaff();
    const id = formText(formData, "id");
    const draft = announcementSchema.parse({
      title: formText(formData, "title"),
      body: formText(formData, "body"),
      event_date: formText(formData, "event_date"),
    });
    const supabase = await createSupabaseServerClient();
    if (id) {
      const { error } = await supabase
        .from("announcements")
        .update({
          draft,
          updated_by: session.userId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
      result = { ok: "下書きを保存しました" };
    } else {
      const { error } = await supabase.from("announcements").insert({
        draft,
        status: "draft",
        updated_by: session.userId,
      });
      if (error) throw new Error(error.message);
      result = { ok: "お知らせを追加しました(下書き)" };
    }
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  await finish(back, result);
}

/* ---------------- 共通: 状態変更・並び替え・削除 ---------------- */

function assertContentTable(table: string): asserts table is (typeof contentTables)[number] {
  if (!(contentTables as readonly string[]).includes(table)) {
    throw new Error("不正なテーブル指定です");
  }
}

// 公開申請・取り下げは写真にも適用できる
function assertReviewableTable(table: string): void {
  if (
    !(contentTables as readonly string[]).includes(table) &&
    table !== "photos"
  ) {
    throw new Error("不正なテーブル指定です");
  }
}

/** editor: 下書き → 公開待ちの申請 */
export async function submitForReview(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: Result;
  try {
    await requireStaff();
    const table = formText(formData, "table");
    const id = formText(formData, "id");
    assertReviewableTable(table);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from(table)
      .update({ status: "pending" })
      .eq("id", id)
      .eq("status", "draft");
    if (error) throw new Error(error.message);
    result = { ok: "公開申請しました。代表者の公開操作をお待ちください" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  await finish(back, result);
}

/** 公開待ち → 下書きに戻す */
export async function withdrawReview(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: Result;
  try {
    await requireStaff();
    const table = formText(formData, "table");
    const id = formText(formData, "id");
    assertReviewableTable(table);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from(table)
      .update({ status: "draft" })
      .eq("id", id)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    result = { ok: "公開申請を取り下げました" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  await finish(back, result);
}

/** 並び替え(activities / faqs) */
export async function moveItem(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: Result;
  try {
    await requireStaff();
    const table = formText(formData, "table");
    const id = formText(formData, "id");
    const dir = formText(formData, "dir");
    if (table !== "activities" && table !== "faqs") {
      throw new Error("不正なテーブル指定です");
    }
    if (dir !== "up" && dir !== "down") throw new Error("不正な操作です");

    const supabase = await createSupabaseServerClient();
    const { data: rows, error } = await supabase
      .from(table)
      .select("id, sort_order")
      .order("sort_order");
    if (error) throw new Error(error.message);
    const list = rows ?? [];
    const index = list.findIndex((r) => r.id === id);
    const swapWith = dir === "up" ? index - 1 : index + 1;
    if (index === -1 || swapWith < 0 || swapWith >= list.length) {
      result = { ok: "これ以上移動できません" };
    } else {
      const a = list[index];
      const b = list[swapWith];
      // 同値の場合に備えて連番を振り直す
      const updates = list.map((r, i) => ({
        id: r.id,
        order: r.id === a.id ? swapWith + 1 : r.id === b.id ? index + 1 : i + 1,
      }));
      for (const u of updates) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ sort_order: u.order })
          .eq("id", u.id);
        if (updateError) throw new Error(updateError.message);
      }
      result = { ok: "並び順を変更しました" };
    }
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  await finish(back, result);
}

/** 削除(代表者のみ。RLSでも二重に制限) */
export async function deleteContent(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: Result;
  try {
    await requireRepresentative();
    const table = formText(formData, "table");
    const id = formText(formData, "id");
    assertContentTable(table);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) throw new Error(error.message);
    result = { ok: "削除しました" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  await finish(back, result);
}
