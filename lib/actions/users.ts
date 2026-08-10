"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { requireRepresentative } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { inviteUserSchema } from "@/lib/validation";
import { errorMessage, resultUrl, safeBack } from "./helpers";

export interface InviteResult {
  ok: boolean;
  message: string;
  email?: string;
  password?: string;
}

/**
 * メンバー追加(代表者のみ)。
 * 公開サインアップは無効のため、service role でユーザーを作成し、
 * 初期パスワードを画面に一度だけ表示する(本人がログイン後に変更)。
 */
export async function inviteUser(
  _prev: InviteResult | null,
  formData: FormData
): Promise<InviteResult> {
  try {
    await requireRepresentative();
    const input = inviteUserSchema.parse({
      email: String(formData.get("email") ?? ""),
      display_name: String(formData.get("display_name") ?? ""),
      role: String(formData.get("role") ?? "editor"),
    });

    const admin = createAdminClient();
    if (!admin) {
      return {
        ok: false,
        message:
          "SUPABASE_SERVICE_ROLE_KEY が設定されていないため、ユーザーを作成できません",
      };
    }

    const password = randomBytes(9).toString("base64url"); // 12文字
    const { error } = await admin.auth.admin.createUser({
      email: input.email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: input.display_name,
        role: input.role,
      },
    });
    if (error) return { ok: false, message: error.message };

    return {
      ok: true,
      message:
        "メンバーを追加しました。以下の初期パスワードを本人に安全な方法で伝えてください(この画面にしか表示されません)",
      email: input.email,
      password,
    };
  } catch (e) {
    return { ok: false, message: errorMessage(e) };
  }
}

export async function updateUserRole(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: { ok?: string; error?: string };
  try {
    await requireRepresentative();
    const id = String(formData.get("id") ?? "");
    const role = String(formData.get("role") ?? "");
    if (role !== "editor" && role !== "representative") {
      throw new Error("不正な権限指定です");
    }
    const supabase = await createSupabaseServerClient();
    // 代表者0人化はDBトリガーでも防止される
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);
    if (error) throw new Error(error.message);
    result = { ok: "権限を変更しました" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  redirect(resultUrl(back, result));
}

export async function removeUser(formData: FormData): Promise<void> {
  const back = safeBack(formData.get("back"));
  let result: { ok?: string; error?: string };
  try {
    const session = await requireRepresentative();
    const id = String(formData.get("id") ?? "");
    if (id === session.userId) {
      throw new Error("自分自身は削除できません");
    }
    const admin = createAdminClient();
    if (!admin) {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY が設定されていないため、ユーザーを削除できません"
      );
    }
    // 代表者0人化の防止(profilesの削除トリガーでも二重に防止される)
    const supabase = await createSupabaseServerClient();
    const { data: target } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", id)
      .single();
    if (target?.role === "representative") {
      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "representative");
      if ((count ?? 0) <= 1) {
        throw new Error("代表者を0人にすることはできません");
      }
    }
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);
    result = { ok: "メンバーを削除しました" };
  } catch (e) {
    result = { error: errorMessage(e) };
  }
  redirect(resultUrl(back, result));
}
