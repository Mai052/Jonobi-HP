"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { errorMessage } from "./helpers";

export async function login(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  let error: string | null = null;

  if (!email || !password) {
    error = "メールアドレスとパスワードを入力してください";
  } else {
    try {
      const supabase = await createSupabaseServerClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        error = "メールアドレスまたはパスワードが正しくありません";
      }
    } catch (e) {
      error = errorMessage(e);
    }
  }

  if (error) {
    redirect(`/admin/login?error=${encodeURIComponent(error)}`);
  }
  redirect("/admin");
}

export async function logout(): Promise<void> {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  } catch {
    // 未設定時は何もしない
  }
  redirect("/admin/login");
}
