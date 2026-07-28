import MapSearchPageClient from "./_components/MapSearchPageClient";

type MapSearchPageProps = {
  searchParams: Promise<{
    day?: string | string[];
  }>;
};

export default async function MapSearchPage({
  searchParams,
}: MapSearchPageProps) {
  const { day } = await searchParams;

  return (
    <MapSearchPageClient
      day={typeof day === "string" ? day : "day1"}
    />
  );
}
