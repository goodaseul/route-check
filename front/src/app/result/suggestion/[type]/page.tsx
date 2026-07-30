import { notFound } from "next/navigation";
import SuggestionDetail from "../_components/SuggestionDetail";
import {
  isSuggestionType,
  SUGGESTION_DETAIL_DATA,
  SUGGESTION_TYPES,
} from "../_data/suggestion-detail-data";

type SuggestionDetailPageProps = {
  params: Promise<{ type: string }>;
  searchParams: Promise<{
    date?: string | string[];
    day?: string | string[];
    applied?: string | string[];
  }>;
};

export function generateStaticParams() {
  return SUGGESTION_TYPES.map((type) => ({ type }));
}

export default async function SuggestionDetailPage({
  params,
  searchParams,
}: SuggestionDetailPageProps) {
  const [{ type }, query] = await Promise.all([params, searchParams]);

  if (!isSuggestionType(type)) notFound();

  return (
    <SuggestionDetail
      detail={SUGGESTION_DETAIL_DATA[type]}
      date={getSingleParam(query.date)}
      day={getSingleParam(query.day)}
      applied={getSingleParam(query.applied)}
    />
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}
