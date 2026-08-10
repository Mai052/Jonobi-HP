import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./env";

let cached: SupabaseClient | null = null;

/**
 * 公開ページ用の匿名クライアント。
 * Cookie を使わないため、公開ページを静的生成(ISR)できる。
 * RLS により公開中(status='published')のコンテンツのみ取得できる。
 */
export function createPublicClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  cached ??= createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}
