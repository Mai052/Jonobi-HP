import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

/**
 * service role クライアント。RLS をバイパスするため、
 * 使用箇所は「計測イベントのINSERT」「ユーザー管理」「Storageのオブジェクト削除」に限定する。
 * キーはサーバー環境変数のみに保持し、クライアントへは絶対に渡さない。
 */
export function createAdminClient(): SupabaseClient | null {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!supabaseUrl || !serviceRoleKey) return null;
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
