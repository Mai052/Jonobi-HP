import { createSupabaseServerClient } from "./supabase/server";
import type { Profile } from "./types";

export interface StaffSession {
  userId: string;
  email: string;
  profile: Profile;
}

/** ログイン中のスタッフ情報を取得(未ログインなら null) */
export async function getStaffSession(): Promise<StaffSession | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, role, created_at")
      .eq("id", user.id)
      .single();
    if (!profile) return null;
    return {
      userId: user.id,
      email: user.email ?? "",
      profile: profile as Profile,
    };
  } catch {
    return null;
  }
}

/** Server Actions 用: ログイン必須(サーバー側の権限チェック第一層) */
export async function requireStaff(): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) throw new Error("ログインが必要です");
  return session;
}

/** Server Actions 用: 代表者のみ */
export async function requireRepresentative(): Promise<StaffSession> {
  const session = await requireStaff();
  if (session.profile.role !== "representative") {
    throw new Error("この操作は代表者のみ可能です");
  }
  return session;
}
