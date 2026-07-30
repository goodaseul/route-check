import type { SuggestionDetail } from "../_data/suggestion-detail-data";

export default function SuggestionChangeCard({
  changes,
}: Pick<SuggestionDetail, "changes">) {
  return (
    <dl className="mt-5 overflow-hidden rounded-card border border-semantic-400 bg-semantic-100 px-8 py-3.5 shadow-card">
      {changes.map((change, index) => (
        <div
          key={change.label}
          className={`flex items-center justify-between gap-5 py-3 ${
            index < changes.length - 1
              ? "border-b border-semantic-400"
              : ""
          }`}
        >
          <dt className="shrink-0 text-d1 font-medium text-semantic-600">
            {change.label}
          </dt>
          <dd
            className={`min-w-0 text-right text-b3 ${
              change.emphasized
                ? "font-bold text-semantic-800"
                : "font-medium text-semantic-600"
            }`}
          >
            {change.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
