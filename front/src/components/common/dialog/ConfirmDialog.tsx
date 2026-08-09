"use client";

import Button from "@/components/common/buttons/Button";
import { useOverlay } from "@/hooks/useOverlay";
import { useId } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const { handleBackdropMouseDown } = useOverlay({
    open,
    onClose: onCancel,
  });

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-semantic-900/50 px-5"
      onMouseDown={handleBackdropMouseDown}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="w-full max-w-100 
        rounded-card bg-semantic-100 px-8 py-8 shadow-2xl"
      >
        <h2 id={titleId} className="text-h3 font-bold text-semantic-800">
          {title}
        </h2>
        <div
          id={descriptionId}
          className="mt-4 text-b1 font-medium leading-relaxed text-semantic-600"
        >
          {description}
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          <Button onClick={onCancel}>취소</Button>
          <Button buttonBg="blue" autoFocus onClick={onConfirm}>
            확인
          </Button>
        </div>
      </section>
    </div>
  );
}
