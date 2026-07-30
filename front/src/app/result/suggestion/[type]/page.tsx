import { notFound } from "next/navigation";
import { Suspense } from "react";
import SuggestionDetail from "../_components/SuggestionDetail";
import {
  isSuggestionType,
  SUGGESTION_DETAIL_DATA,
  SUGGESTION_TYPES,
} from "../_data/suggestion-detail-data";

type SuggestionDetailPageProps = {
  params: Promise<{ type: string }>;
};

export function generateStaticParams() {
  return SUGGESTION_TYPES.map((type) => ({ type }));
}

export default async function SuggestionDetailPage({
  params,
}: SuggestionDetailPageProps) {
  const { type } = await params;

  if (!isSuggestionType(type)) notFound();

  return (
    <Suspense fallback={null}>
      <SuggestionDetail detail={SUGGESTION_DETAIL_DATA[type]} />
    </Suspense>
  );
}
