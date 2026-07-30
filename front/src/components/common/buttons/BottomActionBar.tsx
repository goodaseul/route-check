"use client";

import Button from "./Button";

type Action = {
  label: string;
  onClick: () => void;
};

type BottomActionBarProps = {
  primaryAction: Action;
  secondaryAction?: Action;
};

export default function BottomActionBar({
  primaryAction,
  secondaryAction,
}: BottomActionBarProps) {
  return (
    <div
      className={`sticky bottom-0 z-30 grid gap-3 bg-semantic-100 px-6 pt-4 pb-6 ${
        secondaryAction ? "grid-cols-2" : "grid-cols-1"
      }`}
    >
      {secondaryAction && (
        <Button onClick={secondaryAction.onClick}>
          {secondaryAction.label}
        </Button>
      )}
      <Button buttonBg="blue" onClick={primaryAction.onClick}>
        {primaryAction.label}
      </Button>
    </div>
  );
}
