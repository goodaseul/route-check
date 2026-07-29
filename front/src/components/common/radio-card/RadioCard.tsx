import { useId } from "react";

type RadioCardProps<T extends string> = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
> & {
  children: React.ReactNode;
  value: T;
  onChange?: (value: T) => void;
};
export default function RadioCard<T extends string>({
  id,
  name,
  value,
  children,
  checked,
  disabled,
  onChange,
  ...props
}: RadioCardProps<T>) {
  const generatedId = useId();
  const radioId = id || generatedId;

  return (
    <label
      htmlFor={radioId}
      className={`relative  select-none block ${disabled ? "pointer-events-none" : "cursor-pointer"}`}
    >
      <input
        id={radioId}
        type="radio"
        name={name}
        value={value}
        className="peer sr-only"
        disabled={disabled}
        checked={checked}
        onChange={() => onChange?.(value)}
        {...props}
      />
      <div
        className="
          flex items-center justify-center h-14 px-4 rounded-[8px] border border-semantic-400 bg-semantic-100
          text-b1 font-medium text-semantic-600 transition-all
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
