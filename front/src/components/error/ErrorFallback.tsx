interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export default function ErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorFallbackProps) {
  return (
    <div role="alert" className="p-4 border rounded-md">
      <p className="font-semibold">문제가 발생했습니다</p>
      <pre className="text-sm text-red-500 whitespace-pre-wrap">
        {error.message}
      </pre>
      <button
        onClick={resetErrorBoundary}
        className="mt-2 px-3 py-1 bg-gray-200 rounded"
      >
        다시 시도
      </button>
    </div>
  );
}
