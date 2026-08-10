import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

/**
 * ログインユーザーのセッション(Cookie)付きサーバークライアント。
 * 管理画面・プレビュー・Server Actions で使用する。
 */
export async function createSupabaseServerClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabaseが設定されていません");
  }
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Server Component からの呼び出し時は Cookie を書き込めない(middleware が更新する)
        }
      },
    },
  });
}
