import {
  submitForReview,
  withdrawReview,
  deleteContent,
} from "@/lib/actions/content";
import { publishItem, unpublishItem } from "@/lib/actions/publish";
import type { ContentStatus, Role } from "@/lib/types";

const buttonBase =
  "rounded-full px-4 py-1.5 text-xs font-bold transition-colors disabled:opacity-40";

function HiddenFields({
  table,
  id,
  back,
}: {
  table: string;
  id: string;
  back: string;
}) {
  return (
    <>
      <input type="hidden" name="table" value={table} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="back" value={back} />
    </>
  );
}

/**
 * 公開ワークフローの操作ボタン群。
 * editor: 公開申請 / 申請取り下げ のみ
 * representative: 公開 / 非公開 / 削除
 */
export function PublishControls({
  table,
  id,
  status,
  role,
  back,
  canDelete = false,
}: {
  table: string;
  id: string;
  status: ContentStatus;
  role: Role;
  back: string;
  canDelete?: boolean;
}) {
  const isRep = role === "representative";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isRep && status === "draft" && (
        <form action={submitForReview}>
          <HiddenFields table={table} id={id} back={back} />
          <button
            type="submit"
            className={`${buttonBase} bg-rice-300 text-ainezu-900 hover:bg-rice-400`}
          >
            公開申請
          </button>
        </form>
      )}
      {status === "pending" && (
        <form action={withdrawReview}>
          <HiddenFields table={table} id={id} back={back} />
          <button
            type="submit"
            className={`${buttonBase} bg-snow-200 text-ainezu-700 hover:bg-snow-300`}
          >
            申請を取り下げ
          </button>
        </form>
      )}
      {isRep && status !== "published" && (
        <form action={publishItem}>
          <HiddenFields table={table} id={id} back={back} />
          <button
            type="submit"
            className={`${buttonBase} bg-forest-600 text-white hover:bg-forest-700`}
          >
            公開する
          </button>
        </form>
      )}
      {isRep && status === "published" && (
        <>
          <form action={publishItem}>
            <HiddenFields table={table} id={id} back={back} />
            <button
              type="submit"
              className={`${buttonBase} bg-forest-600 text-white hover:bg-forest-700`}
            >
              最新の下書きを公開
            </button>
          </form>
          <form action={unpublishItem}>
            <HiddenFields table={table} id={id} back={back} />
            <button
              type="submit"
              className={`${buttonBase} bg-ainezu-100 text-ainezu-700 hover:bg-ainezu-200`}
            >
              非公開にする
            </button>
          </form>
        </>
      )}
      {isRep && canDelete && (
        <form action={deleteContent}>
          <HiddenFields table={table} id={id} back={back} />
          <button
            type="submit"
            className={`${buttonBase} bg-red-50 text-red-600 hover:bg-red-100`}
          >
            削除
          </button>
        </form>
      )}
    </div>
  );
}
