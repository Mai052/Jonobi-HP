"use client";

import { useActionState } from "react";
import { inviteUser, type InviteResult } from "@/lib/actions/users";

const inputClass =
  "w-full rounded-lg border border-snow-300 bg-white px-3 py-2 text-sm";

export function InviteUserForm() {
  const [result, formAction, pending] = useActionState<
    InviteResult | null,
    FormData
  >(inviteUser, null);

  return (
    <div className="rounded-2xl border border-snow-200 bg-white p-5">
      <h2 className="font-bold text-ainezu-900">メンバーを追加</h2>
      <p className="mt-1 text-xs text-ainezu-500">
        追加すると初期パスワードが一度だけ表示されます。本人に安全な方法で伝えてください。
      </p>
      <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ainezu-700">メールアドレス</span>
          <input
            type="email"
            name="email"
            required
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ainezu-700">表示名</span>
          <input
            type="text"
            name="display_name"
            required
            maxLength={50}
            className={`mt-1 ${inputClass}`}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ainezu-700">権限</span>
          <select name="role" className={`mt-1 ${inputClass}`}>
            <option value="editor">editor(編集・下書き保存)</option>
            <option value="representative">
              representative(公開・ユーザー管理)
            </option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-forest-600 px-6 py-2 text-sm font-bold text-white hover:bg-forest-700 disabled:opacity-50"
          >
            {pending ? "追加中..." : "追加する"}
          </button>
        </div>
      </form>
      {result && (
        <div
          role="status"
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
            result.ok
              ? "border-forest-200 bg-forest-50 text-forest-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          <p className="font-medium">{result.message}</p>
          {result.ok && result.password && (
            <div className="mt-2 rounded-lg bg-white p-3 font-mono text-xs">
              <p>メール: {result.email}</p>
              <p>初期パスワード: {result.password}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
