import { z } from "zod";

/** リダイレクト先はadmin配下のみ許可(オープンリダイレクト防止) */
export function safeBack(value: FormDataEntryValue | null): string {
  const s = typeof value === "string" ? value : "";
  return s.startsWith("/admin") && !s.includes("//") ? s : "/admin";
}

export function errorMessage(e: unknown): string {
  if (e instanceof z.ZodError) {
    return e.issues.map((i) => i.message).join(" / ");
  }
  if (e instanceof Error) return e.message;
  return "エラーが発生しました";
}

/** back に ok / error クエリを付けたURLを作る */
export function resultUrl(
  back: string,
  result: { ok?: string; error?: string }
): string {
  const url = new URL(back, "http://local");
  url.searchParams.delete("ok");
  url.searchParams.delete("error");
  if (result.ok) url.searchParams.set("ok", result.ok);
  if (result.error) url.searchParams.set("error", result.error);
  return `${url.pathname}?${url.searchParams.toString()}${url.hash}`;
}
