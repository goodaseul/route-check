type TabItem = {
  label: string;
  value: string;
};

type TabProps = {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
};

export default function Tab({ items, value, onChange }: TabProps) {
  return (
    <ul className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
      {items.map((item) => {
        const isActive = value === item.value;

        return (
          <li key={item.value} className="shrink-0">
            <button
              type="button"
              onClick={() => onChange(item.value)}
              className={`
                px-4 py-2 text-sm rounded-full transition-colors whitespace-nowrap
                ${
                  isActive
                    ? "bg-semantic-900 text-semantic-100 font-semibold"
                    : "bg-semantic-300 text-semantic-600 font-medium hover:bg-semantic-400"
                }
              `}
            >
              {item.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
