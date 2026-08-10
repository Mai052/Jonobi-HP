import type { ContentStatus } from "@/lib/types";

const STATUS_LABELS: Record<ContentStatus, { label: string; className: string }> =
  {
    draft: { label: "下書き", className: "bg-snow-200 text-ainezu-700" },
    pending: { label: "公開待ち", className: "bg-rice-200 text-ainezu-900" },
    published: { label: "公開中", className: "bg-forest-100 text-forest-700" },
    unpublished: { label: "非公開", className: "bg-ainezu-100 text-ainezu-500" },
  };

export function StatusBadge({
  status,
  hasUnpublishedChanges = false,
}: {
  status: ContentStatus;
  hasUnpublishedChanges?: boolean;
}) {
  const config = STATUS_LABELS[status] ?? STATUS_LABELS.draft;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${config.className}`}
      >
        {config.label}
      </span>
      {status === "published" && hasUnpublishedChanges && (
        <span className="rounded-full bg-rice-100 px-2.5 py-0.5 text-xs font-medium text-ainezu-700">
          未公開の変更あり
        </span>
      )}
    </span>
  );
}
