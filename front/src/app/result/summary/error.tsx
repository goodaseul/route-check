"use client";

import BottomActionBar from "@/components/common/buttons/BottomActionBar";
import ResultState from "@/components/common/result-state/ResultState";
import Header from "@/components/layout/Header";
import Inner from "@/components/layout/Inner";
import { useEffect } from "react";

type SummaryErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function SummaryError({ error, reset }: SummaryErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <Inner styles="flex flex-1 flex-col">
        <ResultState
          status="error"
          title="분석에 실패했어요"
          description="네트워크 연결을 확인하고 다시 시도해 주세요"
          className="flex-1"
        />
      </Inner>

      <BottomActionBar
        primaryAction={{
          label: "다시 시도",
          onClick: reset,
        }}
      />
    </div>
  );
}
