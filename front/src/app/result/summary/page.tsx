import SummaryPageClient from "./_components/SummaryPageClient";
type SummaryPageProps = {
  searchParams: Promise<{
    date?: string | string[];
    mode?: string | string[];
  }>;
};

export default async function SummaryPage({ searchParams }: SummaryPageProps) {
  const { date, mode } = await searchParams;
  const isConfirmed = mode === "confirmed";
  return (
    <SummaryPageClient
      isConfirmed={isConfirmed}
      date={typeof date === "string" ? date : null}
    />
  );
}
