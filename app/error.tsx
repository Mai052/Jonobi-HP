"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-bold text-ainezu-900">
        エラーが発生しました
      </h1>
      <p className="mt-2 text-sm text-ainezu-600">
        時間をおいて再度お試しください。
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-forest-600 px-6 py-3 text-sm font-bold text-white hover:bg-forest-700"
      >
        再読み込み
      </button>
    </div>
  );
}
