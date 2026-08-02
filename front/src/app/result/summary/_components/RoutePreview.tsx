"use client";

import ConfirmDialog from "@/components/common/dialog/ConfirmDialog";
import { showToast } from "@/lib/utils/toast";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false);
  const suggestionParams = new URLSearchParams();
  if (date) suggestionParams.set("date", date);
  const suggestionQuery = suggestionParams.toString();

  const handleContinue = () => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
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
    router.push(
      `/plan/schedule${suggestionQuery ? `?${suggestionQuery}` : ""}`,
    );
  };

  const handleSave = () => {
    closeSaveSheet();
    showToast("저장이 완료됐어요!");
  };

  return (
    <>
      <RoutePreviewView
        {...props}
        onContinue={handleContinue}
        onEditSchedule={() => setIsEditDialogOpen(true)}
        onViewSuggestion={() =>
          router.push(
            `/result/suggestion${suggestionQuery ? `?${suggestionQuery}` : ""}`,
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
        onSavePdf={handleSave}
        onSaveImage={handleSave}
      />
    </>
  );
}
