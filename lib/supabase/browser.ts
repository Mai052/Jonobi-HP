"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * ブラウザ用クライアント。ログインセッション(Cookie)を共有するため、
 * 認証済みユーザーとしてSupabase Storageへ直接アップロードできる。
 * 大きな画像ファイルをVercelのサーバー関数(リクエストサイズ上限あり)経由にせず、
 * ブラウザ→Supabase Storageへ直接送ることで容量制限を回避する。
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
