import { ChevronRight } from "lucide-react";
import type { Suggestion } from "../_data/suggestion-list-data";
import SuggestionTypeIcon from "./SuggestionTypeIcon";

type SuggestionCardProps = {
  suggestion: Suggestion;
  onClick: () => void;
};

function getEffectMark(effect: string) {
  if (effect.includes("단축")) return "▼";
  if (effect.includes("상승")) return "▲";
  return "";
}

export default function SuggestionCard({
  suggestion,
  onClick,
}: SuggestionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center rounded-card border border-semantic-300 bg-semantic-100 px-6 py-7 text-left shadow-card transition-colors hover:bg-semantic-300"
    >
      <SuggestionTypeIcon type={suggestion.type} />

      <span className="ml-5 min-w-0 flex-1">
        <strong className="block text-b1 font-semibold text-semantic-800">
          {suggestion.title}
        </strong>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="text-b3 text-semantic-600">
            {suggestion.description}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-d1 font-semibold ${
              suggestion.type === "order"
                ? "bg-blue-100 text-blue-500"
                : suggestion.type === "transport"
                  ? "bg-green-100 text-green-500"
                  : "bg-[#fde2ec] text-[#ed6c9e]"
            }`}
          >
            {suggestion.effect} {getEffectMark(suggestion.effect)}
          </span>
        </span>
      </span>

      <ChevronRight
        className="ml-3 shrink-0 text-semantic-400"
        size={26}
        strokeWidth={2}
        aria-hidden="true"
      />
    </button>
  );
}
