import type { SuggestionDetail } from "../_data/suggestion-detail-data";
import SuggestionTypeIcon from "./SuggestionTypeIcon";

export default function AppliedSuggestionCard({
  detail,
}: {
  detail: SuggestionDetail;
}) {
  return (
    <div className="mt-4 flex items-center rounded-card border border-semantic-300 bg-semantic-100 px-6 py-5 shadow-card">
      <SuggestionTypeIcon type={detail.type} size="small" />
      <span className="ml-4 min-w-0">
        <strong className="block text-b1 font-semibold text-semantic-800">
          {detail.title}
        </strong>
        <span className="mt-1 block truncate text-d1 text-semantic-600">
          {detail.appliedDescription}
        </span>
      </span>
    </div>
  );
}
