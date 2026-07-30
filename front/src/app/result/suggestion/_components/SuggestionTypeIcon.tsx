import { ArrowLeftRight, CalendarDays, CarFront } from "lucide-react";
import type { SuggestionType } from "../_data/suggestion-detail-data";

type SuggestionTypeIconProps = {
  type: SuggestionType;
  size?: "small" | "large";
};

export default function SuggestionTypeIcon({
  type,
  size = "large",
}: SuggestionTypeIconProps) {
  const isSmall = size === "small";
  const iconSize = isSmall ? 22 : 24;

  return (
    <span
      className={`center shrink-0 text-white ${
        isSmall ? "size-12 rounded-xl" : "size-14 rounded-[14px]"
      } ${
        type === "order"
          ? "bg-blue-500"
          : type === "transport"
            ? "bg-green-500"
            : "bg-[#ed6c9e]"
      }`}
    >
      {type === "order" && (
        <ArrowLeftRight size={iconSize} strokeWidth={2.5} aria-hidden="true" />
      )}
      {type === "transport" && (
        <CarFront size={iconSize} strokeWidth={2.5} aria-hidden="true" />
      )}
      {type === "move-day" && (
        <CalendarDays size={iconSize} strokeWidth={2.5} aria-hidden="true" />
      )}
    </span>
  );
}
