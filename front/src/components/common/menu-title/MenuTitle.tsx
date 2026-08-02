"use client";

import { useRouter } from "next/navigation";
import ArrowIcon from "@/components/icons/ArrowIcon";
import CloseIcon from "@/components/icons/CloseIcon";
import Inner from "@/components/layout/Inner";

type MenuTitleState = "back" | "close";

type MenuTitleProps = {
  children: string;
  type?: MenuTitleState;
  customIcon?: React.ReactNode;
  onAction?: () => void;
  className?: string;
  disabled?: boolean;
};

export default function MenuTitle({
  children,
  type = "back",
  customIcon,
  onAction,
  className = "",
  disabled = false,
}: MenuTitleProps) {
  const router = useRouter();

  const isBack = type === "back";
  const positionClass = isBack ? "left-6" : "right-6";

  const handleClick = () => {
    if (onAction) {
      onAction();
      return;
    }

    if (type === "close") {
      router.push("/");
    } else {
      if (typeof window !== "undefined" && window.history.length <= 1) {
        router.push("/");
      } else {
        router.back();
      }
    }
  };

  return (
    <Inner
      styles={`sticky top-0 z-40 h-20 center bg-semantic-100 ${className}`}
    >
      <h2 className="text-h3 font-semibold text-semantic-800">{children}</h2>

      <button
        type="button"
        onClick={handleClick}
        aria-label={isBack ? "뒤로 가기" : "닫기"}
        className={`absolute ${positionClass} top-1/2 flex w-max -translate-y-1/2 items-center justify-center transition-colors ${
          disabled
            ? "cursor-not-allowed text-semantic-400"
            : "text-semantic-800 hover:text-semantic-600"
        }`}
        disabled={disabled}
      >
        {customIcon ? (
          customIcon
        ) : isBack ? (
          <ArrowIcon className="w-6 h-6 rotate-180" />
        ) : (
          <CloseIcon className="w-6 h-6" />
        )}
      </button>
    </Inner>
  );
}
