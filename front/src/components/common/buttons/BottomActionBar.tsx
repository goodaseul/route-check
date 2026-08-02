"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";
import Button, { type ButtonProps } from "./Button";

type Action = Omit<ButtonProps, "children"> & {
  label: ReactNode;
};

type BottomActionBarProps = HTMLAttributes<HTMLDivElement> & {
  primaryAction: Action;
  secondaryAction?: Action;
  withTopGradient?: boolean;
};

export default function BottomActionBar({
  primaryAction,
  secondaryAction,
  withTopGradient = false,
  className,
  ...props
}: BottomActionBarProps) {
  const {
    label: primaryLabel,
    buttonBg: primaryButtonBg = "blue",
    ...primaryButtonProps
  } = primaryAction;
  const {
    label: secondaryLabel,
    buttonBg: secondaryButtonBg = "white",
    ...secondaryButtonProps
  } = secondaryAction ?? {};

  return (
    <div
      className={twMerge(
        "sticky bottom-0 z-30 mt-auto grid gap-3 bg-semantic-100 px-6 pt-4 pb-6",
        secondaryAction ? "grid-cols-2" : "grid-cols-1",
        className,
      )}
      {...props}
    >
      {withTopGradient && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-14 right-0 left-0 h-14 bg-linear-to-b from-transparent to-semantic-100"
        />
      )}
      {secondaryAction && (
        <Button buttonBg={secondaryButtonBg} {...secondaryButtonProps}>
          {secondaryLabel}
        </Button>
      )}
      <Button buttonBg={primaryButtonBg} {...primaryButtonProps}>
        {primaryLabel}
      </Button>
    </div>
  );
}
