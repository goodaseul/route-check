"use client";

import { useOverlay } from "@/hooks/useOverlay";
import { ChevronRight, X } from "lucide-react";

type SaveResultSheetProps = {
  open: boolean;
  onClose: () => void;
  onSavePdf: () => void;
  onSaveImage: () => void;
};

export default function SaveResultSheet({
  open,
  onClose,
  onSavePdf,
  onSaveImage,
}: SaveResultSheetProps) {
  const { handleBackdropMouseDown } = useOverlay({ open, onClose });

  if (!open) return null;

  const actions = [
    { label: "PDF로 저장하기", onClick: onSavePdf },
    { label: "이미지로 저장하기", onClick: onSaveImage },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-semantic-900/50"
      onMouseDown={handleBackdropMouseDown}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-result-title"
        className="fixed bottom-0 w-full max-w-container rounded-t-card bg-semantic-100 
        px-6 
        py-8 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-3">
          <h2
            id="save-result-title"
            className="text-h3-sm font-semibold text-semantic-800"
          >
            저장하기
          </h2>
          <button
            type="button"
            aria-label="저장 메뉴 닫기"
            className="-mr-2 rounded-full p-2 text-semantic-700"
            onClick={onClose}
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <div>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className="flex w-full items-center justify-between py-5 
              text-left text-b3 font-semibold text-semantic-800 border-b border-semantic-400
              last:border-b-0
              "
              onClick={action.onClick}
            >
              {action.label}
              <ChevronRight
                aria-hidden="true"
                size={18}
                className="text-semantic-500"
              />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
