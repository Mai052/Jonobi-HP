"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { registerPhoto } from "@/lib/actions/photos";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "@/lib/validation";
import type { PhotoSlot } from "@/lib/types";

interface SlotOption {
  slot: PhotoSlot;
  label: string;
  ratio: string;
}

interface ActivityOption {
  id: string;
  title: string;
}

/**
 * 写真アップロードフォーム。
 * 画像本体はブラウザから直接Supabase Storageへアップロードし、
 * サーバーへは保存先パス等の軽量なメタ情報のみを送る
 * (Vercelのサーバー関数のリクエストサイズ上限を画像バイナリが経由しないようにするため)。
 */
export function PhotoUploadForm({
  slotOptions,
  activityOptions,
}: {
  slotOptions: SlotOption[];
  activityOptions: ActivityOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [slot, setSlot] = useState<string>(slotOptions[0]?.slot ?? "");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{
    ok?: string;
    error?: string;
  } | null>(null);

  const isActivitySlot = slot === "activity_card" || slot === "activity_detail";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement;
    const activityId =
      (form.elements.namedItem("activity_id") as HTMLSelectElement)?.value ??
      "";
    const alt =
      (form.elements.namedItem("alt") as HTMLInputElement)?.value ?? "";
    const file = fileInput?.files?.[0];

    if (!file) {
      setMessage({ error: "画像ファイルを選択してください" });
      return;
    }
    const ext = ALLOWED_IMAGE_TYPES[file.type];
    if (!ext) {
      setMessage({ error: "JPG / PNG / WebP の画像のみアップロードできます" });
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setMessage({ error: "ファイルサイズは10MB以下にしてください" });
      return;
    }
    if (isActivitySlot && !activityId) {
      setMessage({ error: "対象の活動を選択してください" });
      return;
    }

    setPending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const path = `${slot}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(path, file, {
          contentType: file.type,
          cacheControl: "31536000",
        });
      if (uploadError) {
        setMessage({
          error: `アップロードに失敗しました: ${uploadError.message}`,
        });
        return;
      }

      const result = await registerPhoto({
        slot,
        activityId,
        storagePath: path,
        alt,
      });
      setMessage(result);
      if (result.ok) {
        form.reset();
        setSlot(slotOptions[0]?.slot ?? "");
        router.refresh();
      }
    } catch (err) {
      setMessage({
        error: err instanceof Error ? err.message : "エラーが発生しました",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {message && (
        <div
          role="status"
          className={`mb-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            message.error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-forest-200 bg-forest-50 text-forest-700"
          }`}
        >
          {message.error ?? message.ok}
        </div>
      )}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="grid gap-3 sm:grid-cols-2"
      >
        <label className="block text-sm">
          <span className="font-medium text-ainezu-700">用途</span>
          <select
            name="slot"
            required
            value={slot}
            onChange={(e) => setSlot(e.target.value)}
            className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
          >
            {slotOptions.map((def) => (
              <option key={def.slot} value={def.slot}>
                {def.label}(推奨比率 {def.ratio})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ainezu-700">
            対象の活動(活動カード・活動詳細のみ)
          </span>
          <select
            name="activity_id"
            className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
          >
            <option value="">-- 選択してください --</option>
            {activityOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ainezu-700">画像ファイル</span>
          <input
            type="file"
            name="file"
            required
            accept="image/jpeg,image/png,image/webp"
            className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ainezu-700">
            代替テキスト(写真の内容説明)
          </span>
          <input
            type="text"
            name="alt"
            required
            maxLength={200}
            placeholder="例: 棚田で田植えをするメンバー"
            className="mt-1 w-full rounded-lg border border-snow-300 px-3 py-2 text-sm"
          />
        </label>
        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-forest-600 px-6 py-2 text-sm font-bold text-white hover:bg-forest-700 disabled:opacity-50"
          >
            {pending ? "アップロード中..." : "アップロード"}
          </button>
        </div>
      </form>
    </div>
  );
}
