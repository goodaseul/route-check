"use client";

import Image from "next/image";
import Inner from "./Inner";
import { useRouter } from "next/navigation";

type MenuTitleType = "back" | "close";

type MenuTitleProps = {
  children: string;
  type?: MenuTitleType;
  iconSrc?: string;
  onAction?: () => void;
  className?: string;
};

export default function MenuTitle({
  children,
  type = "back",
  iconSrc,
  onAction,
  className = "",
}: MenuTitleProps) {
  const router = useRouter();

  const defaultIcon = type === "back" ? "/icons/back.svg" : "/icons/close.svg";
  const finalIconSrc = iconSrc || defaultIcon;

  const positionClass = type === "back" ? "left-6" : "right-6";

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

      {finalIconSrc && (
        <button
          type="button"
          onClick={handleClick}
          aria-label={type === "back" ? "뒤로 가기" : "닫기"}
          className={`absolute ${positionClass} top-1/2 -translate-y-1/2 w-max p-2 flex items-center justify-center`}
        >
          <Image src={finalIconSrc} alt="" width={24} height={24} />
        </button>
      )}
    </Inner>
  );
}
