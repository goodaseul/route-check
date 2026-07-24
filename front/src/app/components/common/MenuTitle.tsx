"use client";

import { useRouter } from "next/navigation";
import Inner from "../layout/Inner";
import ArrowIcon from "../icons/ArrowIcon";
import CloseIcon from "../icons/CloseIcon";

type MenuTitleState = "back" | "close";

type MenuTitleProps = {
  children: string;
  type?: MenuTitleState;
  customIcon?: React.ReactNode;
  onAction?: () => void;
  className?: string;
};

export default function MenuTitle({
  children,
  type = "back",
  customIcon,
  onAction,
  className = "",
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
    <Inner styles={`h-20 center relative ${className}`}>
      <h2 className="text-h3-sm text-semantic-800">{children}</h2>

      <button
        type="button"
        onClick={handleClick}
        aria-label={isBack ? "뒤로 가기" : "닫기"}
        className={`absolute ${positionClass} top-1/2 -translate-y-1/2 w-max p-2 flex items-center justify-center text-semantic-800 hover:text-semantic-600 transition-colors`}
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
