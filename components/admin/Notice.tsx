/** Server Action の結果(?ok= / ?error=)を表示する */
export function Notice({
  ok,
  error,
}: {
  ok?: string | string[];
  error?: string | string[];
}) {
  const okMessage = Array.isArray(ok) ? ok[0] : ok;
  const errorMessage = Array.isArray(error) ? error[0] : error;
  if (!okMessage && !errorMessage) return null;
  return (
    <div
      role="status"
      className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${
        errorMessage
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-forest-200 bg-forest-50 text-forest-700"
      }`}
    >
      {errorMessage ?? okMessage}
    </div>
  );
}
