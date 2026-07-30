type SummaryStat = {
  label: string;
  value: string;
};

export default function SummaryStatsCard({
  stats,
}: {
  stats: SummaryStat[];
}) {
  return (
    <dl className="rounded-card border border-semantic-400 bg-semantic-100 px-8 py-3.5 shadow-card">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`flex items-center justify-between py-3 ${
            index < stats.length - 1
              ? "border-b border-semantic-400"
              : ""
          }`}
        >
          <dt className="text-d1 font-medium text-semantic-600">
            {stat.label}
          </dt>
          <dd className="text-b3 font-semibold text-semantic-800">
            {stat.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
