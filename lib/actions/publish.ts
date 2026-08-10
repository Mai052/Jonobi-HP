"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRepresentative } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publishableTables } from "@/lib/validation";
import { errorMessage, resultUrl, safeBack } from "./helpers";

function assertPublishable(table: string) {
  if (!(publishableTables as readonly string[]).includes(table)) {
    throw new Error("不正なテーブル指定です");
  }
}

/** 公開(代表者のみ)。DB側でも publish_row 関数と RLS/トリガーで二重チェックされる */
export async function publishItem(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: { ok?: string; error?: string };
  try {
    await requireRepresentative();
    const table = String(formData.get("table") ?? "");
    const id = String(formData.get("id") ?? "");
    assertPublishable(table);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("publish_row", {
      p_table: table,
      p_id: id,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/", "layout");
    result = { ok: "公開しました" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  redirect(resultUrl(back, result));
}

/** 非公開化(代表者のみ) */
export async function unpublishItem(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: { ok?: string; error?: string };
  try {
    await requireRepresentative();
    const table = String(formData.get("table") ?? "");
    const id = String(formData.get("id") ?? "");
    assertPublishable(table);
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("unpublish_row", {
      p_table: table,
      p_id: id,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/", "layout");
    result = { ok: "非公開にしました" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  redirect(resultUrl(back, result));
}
