"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { requireRepresentative, requireStaff } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE,
  photoAltSchema,
} from "@/lib/validation";
import { errorMessage, resultUrl, safeBack } from "./helpers";

const PHOTO_SLOTS = [
  "hero",
  "about",
  "members",
  "activity_card",
  "activity_detail",
] as const;

export async function uploadPhoto(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: { ok?: string; error?: string };
  try {
    const session = await requireStaff();
    const file = formData.get("file");
    const slot = String(formData.get("slot") ?? "");
    const activityId = String(formData.get("activity_id") ?? "");
    const alt = photoAltSchema.parse(String(formData.get("alt") ?? ""));

    if (!(file instanceof File) || file.size === 0) {
      throw new Error("画像ファイルを選択してください");
    }
    const ext = ALLOWED_IMAGE_TYPES[file.type];
    if (!ext) {
      throw new Error("JPG / PNG / WebP の画像のみアップロードできます");
    }
    if (file.size > MAX_IMAGE_SIZE) {
      throw new Error("ファイルサイズは10MB以下にしてください");
    }
    if (!(PHOTO_SLOTS as readonly string[]).includes(slot)) {
      throw new Error("写真の用途が正しくありません");
    }
    const isActivitySlot = slot === "activity_card" || slot === "activity_detail";
    if (isActivitySlot && !activityId) {
      throw new Error("対象の活動を選択してください");
    }

    const supabase = await createSupabaseServerClient();
    const storagePath = `${slot}/${randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("photos")
      .upload(storagePath, file, {
        contentType: file.type,
        cacheControl: "31536000",
      });
    if (uploadError) throw new Error(uploadError.message);

    let countQuery = supabase
      .from("photos")
      .select("id", { count: "exact", head: true })
      .eq("slot", slot);
    if (isActivitySlot) countQuery = countQuery.eq("activity_id", activityId);
    const { count } = await countQuery;

    const { error: insertError } = await supabase.from("photos").insert({
      slot,
      activity_id: isActivitySlot ? activityId : null,
      storage_path: storagePath,
      alt,
      sort_order: (count ?? 0) + 1,
      status: "draft",
      uploaded_by: session.userId,
    });
    if (insertError) throw new Error(insertError.message);
    result = {
      ok: "写真をアップロードしました(下書き)。代表者が公開すると表示されます",
    };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  redirect(resultUrl(back, result));
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
