export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center py-24" role="status">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-snow-300 border-t-forest-600" />
      <span className="sr-only">読み込み中</span>
    </div>
  );
}
