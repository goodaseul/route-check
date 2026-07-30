import SuggestionPageClient from "./_components/SuggestionPageClient";

type SuggestionPageProps = {
  searchParams: Promise<{
    date?: string | string[];
    day?: string | string[];
    applied?: string | string[];
  }>;
};

export default async function SuggestionPage({
  searchParams,
}: SuggestionPageProps) {
  const params = await searchParams;

  return (
    <SuggestionPageClient
      date={getSingleParam(params.date)}
      day={getSingleParam(params.day)}
      applied={getSingleParam(params.applied)}
    />
  );
}

function getSingleParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}
