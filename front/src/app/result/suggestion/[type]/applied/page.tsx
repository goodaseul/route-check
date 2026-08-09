import { notFound } from "next/navigation";
import AppliedSuggestionResult from "../../_components/AppliedSuggestionResult";
import {
  isSuggestionType,
  SUGGESTION_DETAIL_DATA,
} from "../../_data/suggestion-detail-data";
import {
  parseAppliedSuggestions,
  SUGGESTIONS,
} from "../../_data/suggestion-list-data";

type AppliedSuggestionPageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{
    day?: string | string[];
    applied?: string | string[];
    date?: string | string[];
  }>;
};

export default async function AppliedSuggestionPage({
  params,
  searchParams,
}: AppliedSuggestionPageProps) {
  const [{ type }, query] = await Promise.all([params, searchParams]);
  if (!isSuggestionType(type)) notFound();

  const day =
    typeof query.day === "string" && /^day[1-5]$/.test(query.day)
      ? query.day
      : "day1";
  const appliedValue =
    typeof query.applied === "string" ? query.applied : type;
  const appliedSuggestions = parseAppliedSuggestions(appliedValue);
  appliedSuggestions.add(type);
  const applied = Array.from(appliedSuggestions).join(",");
  const hasRemainingSuggestions = (SUGGESTIONS[day] ?? []).some(
    (suggestion) => !appliedSuggestions.has(suggestion.type),
  );

  return (
    <AppliedSuggestionResult
      detail={SUGGESTION_DETAIL_DATA[type]}
      day={day}
      applied={applied}
      date={typeof query.date === "string" ? query.date : null}
      hasRemainingSuggestions={hasRemainingSuggestions}
    />
  );
}
