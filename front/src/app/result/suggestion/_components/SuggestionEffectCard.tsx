import type { SuggestionDetail } from "../_data/suggestion-detail-data";

function getEffectClassName(
  tone: "blue" | "green" | "pink" | "red",
) {
  if (tone === "blue") return "text-blue-500";
  if (tone === "green") return "text-green-500";
  if (tone === "red") return "text-[#ef4444]";
  return "text-[#ed6c9e]";
}

export default function SuggestionEffectCard({
  effects,
}: Pick<SuggestionDetail, "effects">) {
  return (
    <div
      className="mt-6 grid rounded-card border border-semantic-400 bg-semantic-100 px-5 py-7 shadow-card"
      style={{
        gridTemplateColumns: `repeat(${effects.length}, minmax(0, 1fr))`,
      }}
    >
      {effects.map((effect) => (
        <div key={effect.label} className="min-w-0 text-center">
          <span className="block truncate text-d1 text-semantic-600">
            {effect.label}
          </span>
          <strong
            className={`mt-2 block text-b3 font-semibold ${getEffectClassName(effect.tone)}`}
          >
            {effect.value}
          </strong>
        </div>
      ))}
    </div>
  );
}
