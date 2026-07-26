type RadioCardProps = {
  name: string;
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
  checked?: boolean;
  onChange?: (value: string) => void;
};

export default function RadioCard({
  name,
  value,
  children,
  checked,
  disabled,
  onChange,
}: RadioCardProps) {
  return (
    <label
      className={`relative  select-none block ${disabled ? "pointer-events-none" : "cursor-pointer"}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        className="peer sr-only"
        disabled={disabled}
        checked={checked}
        onChange={() => onChange?.(value)}
      />
      <div
        className="
          flex items-center justify-center h-14 px-4 rounded-[8px] border border-semantic-400 bg-semantic-100
          text-b-1 font-medium text-semantic-600 transition-all
          hover:bg-blue-100 hover:text-blue-500 hover:border-transparent
          peer-checked:border-transparent peer-checked:bg-blue-500 peer-checked:text-sb peer-checked:text-semantic-100
          peer-checked:hover:bg-blue-500 
          peer-checked:hover:text-semantic-100 
          peer-checked:hover:border-transparent
          peer-disabled:bg-semantic-300 
          peer-disabled:border-transparent
          peer-disabled:text-semantic-500
          "
      >
        {children}
      </div>
    </label>
  );
}
