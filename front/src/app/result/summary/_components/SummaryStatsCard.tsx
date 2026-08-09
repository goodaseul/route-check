type SummaryStat = {
  label: string;
  value: string;
  change?: string;
};

export default function SummaryStatsCard({ stats }: { stats: SummaryStat[] }) {
  return (
    <dl className="rounded-card border border-semantic-400 bg-semantic-100 px-8 py-3.5 shadow-card">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className={`flex items-center justify-between py-3 ${
            index < stats.length - 1 ? "border-b border-semantic-400" : ""
          }`}
        >
          <dt className="text-d1 font-medium text-semantic-600">
            {stat.label}
          </dt>
          <dd className="flex items-center gap-2 text-b3 font-semibold text-semantic-800">
            {stat.change && (
              <span className="text-d2 font-medium text-semantic-500">
                {stat.change} ▼
              </span>
            )}
            <span>{stat.value}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
