"use client";

import React from "react";
import { useRouter } from "next/navigation";
import CalendarIcon from "@/components/icons/CalendarIcon";
import SpotIcon from "@/components/icons/SpotIcon";
import { showToast } from "@/lib/utils/toast";

type CardState = "plan" | "date";

type SelectionCardProps = {
  children: React.ReactNode;
  type?: CardState;
  customIcon?: React.ReactNode;
  onAction?: () => void;
  toastMessage?: string;
};

export default function SelectionCard({
  children,
  type = "plan",
  customIcon,
  onAction,
  toastMessage,
}: SelectionCardProps) {
  const router = useRouter();
  const isPlan = type === "plan";

  const handleClick = () => {
    if (onAction) {
      onAction();
      return;
    }

    if (toastMessage) {
      showToast(toastMessage);
      return;
    }

    router.push(isPlan ? "/plan" : "/date");
  };

  const cardHoverStyle = isPlan
    ? "hover:bg-blue-500 hover:border-transparent"
    : "hover:bg-green-500 hover:border-transparent";

  const iconBoxBg = isPlan ? "bg-blue-500" : "bg-green-500";

  const iconColor = isPlan
    ? "text-semantic-100 group-hover:text-blue-500"
    : "text-semantic-100 group-hover:text-green-500";

  const IconComponent = isPlan ? CalendarIcon : SpotIcon;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={isPlan ? "여행계획이 있습니다." : "여행 날짜만 정했어요."}
      className={`group w-full rounded-card border border-semantic-300 bg-semantic-100 p-5 flex items-center gap-4 transition-all duration-200 shadow-card cursor-pointer ${cardHoverStyle}`}
    >
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors duration-200 ${iconBoxBg} group-hover:bg-semantic-100`}
      >
        {customIcon ? (
          customIcon
        ) : (
          <IconComponent
            className={`w-6 h-6 transition-colors duration-200 ${iconColor}`}
          />
        )}
      </div>

      <div className="w-full text-left">{children}</div>
    </button>
  );
}
