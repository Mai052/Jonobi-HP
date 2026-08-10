import { redirect } from "next/navigation";
import { InviteUserForm } from "@/components/admin/InviteUserForm";
import { Notice } from "@/components/admin/Notice";
import { removeUser, updateUserRole } from "@/lib/actions/users";
import { getStaffSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

const BACK = "/admin/users";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const session = await getStaffSession();
  if (!session || session.profile.role !== "representative") {
    redirect("/admin");
  }
  const { ok, error } = await searchParams;

  const supabase = await createSupabaseServerClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, role, created_at")
    .order("created_at");

  // メールアドレスは service role でのみ取得できる(auth スキーマ)
  const emailMap = new Map<string, string>();
  const admin = createAdminClient();
  if (admin) {
    const { data } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    for (const user of data?.users ?? []) {
      emailMap.set(user.id, user.email ?? "");
    }
  }

  const users = (profiles ?? []) as Profile[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ainezu-900">ユーザー管理</h1>
        <p className="mt-1 text-xs text-ainezu-500">
          editor は編集と下書き保存まで、representative は公開・削除・ユーザー管理が可能です。
        </p>
      </div>
      <Notice ok={ok} error={error} />

      <InviteUserForm />

      <section className="overflow-x-auto rounded-2xl border border-snow-200 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-snow-200 text-xs text-ainezu-500">
            <tr>
              <th className="px-4 py-3 font-medium">名前</th>
              <th className="px-4 py-3 font-medium">メール</th>
              <th className="px-4 py-3 font-medium">権限</th>
              <th className="px-4 py-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-snow-100">
                <td className="px-4 py-3 font-medium text-ainezu-900">
                  {user.display_name || "(未設定)"}
                  {user.id === session.userId && (
                    <span className="ml-2 text-xs text-ainezu-400">
                      (自分)
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-ainezu-600">
                  {emailMap.get(user.id) || "-"}
                </td>
                <td className="px-4 py-3">
                  <form
                    action={updateUserRole}
                    className="flex items-center gap-2"
                  >
                    <input type="hidden" name="id" value={user.id} />
                    <input type="hidden" name="back" value={BACK} />
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="rounded-lg border border-snow-300 px-2 py-1 text-xs"
                    >
                      <option value="editor">editor</option>
                      <option value="representative">representative</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-full bg-ainezu-700 px-3 py-1 text-xs font-bold text-white"
                    >
                      変更
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  {user.id !== session.userId && (
                    <form action={removeUser}>
                      <input type="hidden" name="id" value={user.id} />
                      <input type="hidden" name="back" value={BACK} />
                      <button
                        type="submit"
                        className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-100"
                      >
                        削除
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <p className="text-xs text-ainezu-500">
        代表交代のときは、新しい代表に representative 権限を付与してから、旧代表のアカウントを削除してください。
        代表者が0人になる操作はシステム側で拒否されます。
      </p>
    </div>
  );
}
