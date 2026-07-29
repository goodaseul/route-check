import SchedulePageClient from "./_components/SchedulePageClient";

type SchedulePageProps = {
  searchParams: Promise<{
    date?: string | string[];
  }>;
};

export default async function SchedulePage({
  searchParams,
}: SchedulePageProps) {
  const { date } = await searchParams;

  return (
    <SchedulePageClient date={typeof date === "string" ? date : null} />
  );
}
