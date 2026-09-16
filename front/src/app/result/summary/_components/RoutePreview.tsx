"use client";

import ConfirmDialog from "@/components/common/dialog/ConfirmDialog";
import { showToast } from "@/lib/utils/toast";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import type { RoutePosition } from "./RouteMap";
import RoutePreviewView from "./RoutePreviewView";
import SaveResultSheet from "./SaveResultSheet";

type RoutePreviewProps = {
  positions: RoutePosition[];
  isPerfectScore: boolean;
  isConfirmed: boolean;
  date: string | null;
};

export default function RoutePreview({ date, ...props }: RoutePreviewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisRequest = usePlanScheduleStore((state) => state.analysisRequest);
  const invalidateAnalysis = usePlanScheduleStore(
    (state) => state.invalidateAnalysis,
  );

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false);

  const transport =
    searchParams.get("transport") ?? analysisRequest?.transport_mode ?? "car";

  const navParams = new URLSearchParams();
  if (date) navParams.set("date", date);
  if (transport) navParams.set("transport", transport);
  const navQuery = navParams.toString();

  const handleContinue = () => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (transport) params.set("transport", transport);
    params.set("mode", "confirmed");

    router.replace(`/result/summary?${params.toString()}`);
  };

  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
  }, []);

  const closeSaveSheet = useCallback(() => {
    setIsSaveSheetOpen(false);
  }, []);

  const handleEditSchedule = () => {
    invalidateAnalysis();
    router.push(
      `/plan/schedule${navQuery ? `?${navQuery}` : ""}`,
    );
  };

  const handleSavePdf = () => {
    closeSaveSheet();
    showToast("PDF 저장 기능은 현재 준비 중이에요.");
  };

  const handleSaveImage = () => {
    closeSaveSheet();
    showToast("이미지 저장 기능은 현재 준비 중이에요.");
  };

  return (
    <>
      <RoutePreviewView
        {...props}
        onContinue={handleContinue}
        onEditSchedule={() => setIsEditDialogOpen(true)}
        onViewSuggestion={() =>
          router.push(
            `/result/suggestion${navQuery ? `?${navQuery}` : ""}`,
          )
        }
        onSave={() => setIsSaveSheetOpen(true)}
      />

      <ConfirmDialog
        open={isEditDialogOpen}
        title="일정을 다시 짜면 결과가 초기화 돼요"
        description={
          <>
            적용한 개선 제안과 분석 결과가 사라져요
            <br />
            계속 할까요?
          </>
        }
        onCancel={closeEditDialog}
        onConfirm={handleEditSchedule}
      />

      <SaveResultSheet
        open={isSaveSheetOpen}
        onClose={closeSaveSheet}
        onSavePdf={handleSavePdf}
        onSaveImage={handleSaveImage}
      />
    </>
  );
}
