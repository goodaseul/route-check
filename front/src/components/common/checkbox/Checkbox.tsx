import React, { useId } from "react";

type CheckboxProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "disabled"
>;

export default function Checkbox({
  id,
  checked,
  onChange,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id || generatedId;

  return (
    <label
      htmlFor={checkboxId}
      className={`
        w-8 h-8
      `}
    >
      <div className="relative  flex items-center justify-center">
        <input
          id={checkboxId}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className={`
            peer appearance-none w-8 h-8 rounded-full
            border border-semantic-400 bg-semantic-100 
            checked:bg-blue-500 checked:border-blue-500
            cursor-pointer
          `}
          {...props}
        />
        <svg
          className="
            pointer-events-none absolute inset-0
            opacity-0 transition-opacity
            peer-checked:opacity-100
        "
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.667 16.4034L14.0103 19.6673L21.3337 12.334"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </label>
  );
}
