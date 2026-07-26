import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import ErrorFallback from "./ErrorFallback";

type AsyncBoundaryProps = {
  children: ReactNode;
  pendingFallback?: ReactNode;
  rejectedFallback?: ReactNode;
};

export default function AsyncBoundary({
  children,
  pendingFallback = <div>로딩중...</div>,
  rejectedFallback,
}: AsyncBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onReset={reset}
          fallbackRender={({ error, resetErrorBoundary }) =>
            rejectedFallback ?? (
              <ErrorFallback
                error={
                  error instanceof Error ? error : new Error(String(error))
                }
                resetErrorBoundary={resetErrorBoundary}
              />
            )
          }
        >
          <Suspense fallback={pendingFallback}>{children}</Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}
