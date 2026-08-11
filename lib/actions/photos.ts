"use server";

import { redirect } from "next/navigation";
import { requireRepresentative, requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { photoAltSchema } from "@/lib/validation";
import { errorMessage, resultUrl, safeBack } from "./helpers";

const PHOTO_SLOTS = [
  "hero",
  "about",
  "members",
  "activity_card",
  "activity_detail",
] as const;

export interface RegisterPhotoInput {
  slot: string;
  activityId: string;
  storagePath: string;
  alt: string;
}

export interface RegisterPhotoResult {
  ok?: string;
  error?: string;
}

/**
 * 写真データ(メタ情報)の登録。
 * 画像本体はブラウザから直接Supabase Storageへアップロード済みで、
 * ここでは保存先パスをphotosテーブルに記録するだけ(Vercelのサーバー関数の
 * リクエストサイズ上限を画像バイナリが経由しないようにするため)。
 */
export async function registerPhoto(
  input: RegisterPhotoInput
): Promise<RegisterPhotoResult> {
  try {
    const session = await requireStaff();
    const alt = photoAltSchema.parse(input.alt);
    const slot = input.slot;

    if (!(PHOTO_SLOTS as readonly string[]).includes(slot)) {
      throw new Error("写真の用途が正しくありません");
    }
    const isActivitySlot =
      slot === "activity_card" || slot === "activity_detail";
    if (isActivitySlot && !input.activityId) {
      throw new Error("対象の活動を選択してください");
    }
    if (!input.storagePath || !input.storagePath.startsWith(`${slot}/`)) {
      throw new Error("アップロードされたファイルが確認できません");
    }

    const supabase = await createSupabaseServerClient();
    let countQuery = supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("slot", slot);
    if (isActivitySlot)
      countQuery = countQuery.eq("activity_id", input.activityId);
    const { count } = await countQuery;

    const { error: insertError } = await supabase.from("photos").insert({
      slot,
      activity_id: isActivitySlot ? input.activityId : null,
      storage_path: input.storagePath,
      alt,
      sort_order: (count ?? 0) + 1,
      status: "draft",
      uploaded_by: session.userId,
    });
    if (insertError) throw new Error(insertError.message);
    return {
      ok: "写真をアップロードしました(下書き)。代表者が公開すると表示されます",
    };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function updatePhotoAlt(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: { ok?: string; error?: string };
  try {
    await requireStaff();
    const id = String(formData.get("id") ?? "");
    const alt = photoAltSchema.parse(String(formData.get("alt") ?? ""));
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("photos")
      .update({ alt })
      .eq("id", id);
    if (error) throw new Error(error.message);
    result = { ok: "代替テキストを保存しました" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  redirect(resultUrl(back, result));
}

export async function movePhoto(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: { ok?: string; error?: string };
  try {
    await requireStaff();
    const id = String(formData.get("id") ?? "");
    const dir = String(formData.get("dir") ?? "");
    if (dir !== "up" && dir !== "down") throw new Error("不正な操作です");

    const supabase = await createSupabaseServerClient();
    const { data: target, error: targetError } = await supabase
      .from("photos")
      .select("id, slot, activity_id")
      .eq("id", id)
      .single();
    if (targetError || !target) throw new Error("写真が見つかりません");

    let groupQuery = supabase
      .from("photos")
      .select("id, sort_order")
      .eq("slot", target.slot)
      .order("sort_order");
    groupQuery =
      target.activity_id === null
        ? groupQuery.is("activity_id", null)
        : groupQuery.eq("activity_id", target.activity_id);
    const { data: rows, error } = await groupQuery;
    if (error) throw new Error(error.message);

    const list = rows ?? [];
    const index = list.findIndex((r) => r.id === id);
    const swapWith = dir === "up" ? index - 1 : index + 1;
    if (index === -1 || swapWith < 0 || swapWith >= list.length) {
      result = { ok: "これ以上移動できません" };
    } else {
      const orders = list.map((r, i) => ({
        id: r.id,
        order:
          i === index ? swapWith + 1 : i === swapWith ? index + 1 : i + 1,
      }));
      for (const u of orders) {
        const { error: updateError } = await supabase
          .from("photos")
          .update({ sort_order: u.order })
          .eq("id", u.id);
        if (updateError) throw new Error(updateError.message);
      }
      result = { ok: "並び順を変更しました" };
    }
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  redirect(resultUrl(back, result));
}

/** 写真の削除(代表者のみ)。DB行とStorageオブジェクトの両方を削除する */
export async function deletePhoto(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: { ok?: string; error?: string };
  try {
    await requireRepresentative();
    const id = String(formData.get("id") ?? "");
    const supabase = await createSupabaseServerClient();
    const { data: photo, error: fetchError } = await supabase
      .from("photos")
      .select("id, storage_path")
      .eq("id", id)
      .single();
    if (fetchError || !photo) throw new Error("写真が見つかりません");

    const { error: deleteError } = await supabase
      .from("photos")
      .delete()
      .eq("id", id);
    if (deleteError) throw new Error(deleteError.message);

    // Storage側の削除はRLS(代表者のみ)の範囲で実行。失敗しても行削除は維持する
    await supabase.storage.from("photos").remove([photo.storage_path]);
    result = { ok: "写真を削除しました" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  redirect(resultUrl(back, result));
}
