"use client";

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import InputClearButton from "./InputClearButton";

type InputAction = {
  icon: ReactNode;
  label: string;
  onClick: () => void;
};

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  required?: boolean;
  errorMessage?: string;
  helperMessage?: string;
  rightIcon?: ReactNode;
  rightAction?: InputAction;
  onClear?: () => void;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      id,
      label,
      required,
      errorMessage,
      helperMessage,
      rightIcon,
      rightAction,
      onClear,
      disabled,
      value,
      onFocus,
      onBlur,
      className = "",
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const [isFocused, setIsFocused] = useState(false);

    const isError = !!errorMessage;
    const hasValue = value !== undefined && value !== "";
    const showClearButton =
      hasValue && !disabled && Boolean(onClear) && isFocused;

    return (
      <div className="flex flex-col gap-2.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-b2 font-semibold text-semantic-800 
            flex items-center gap-0.5"
          >
            {label}
            {required && <span className="text-red-400">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            value={value}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            className={`
                w-full h-14 px-5 rounded-btn border text-b-1 text-semantic-800
                placeholder:text-semantic-500 transition-colors placeholder:font-normal
                focus:outline-none focus:ring-0 focus:border-semantic-400
              ${
                disabled
                  ? "bg-semantic-100 border-semantic-400  text-semantic-400 cursor-not-allowed"
                  : isError
                    ? "border-red-400 bg-semantic-100"
                    : "border-semantic-300 bg-semantic-100 focus:border-blue-500"
              }
              ${
                showClearButton && rightAction
                  ? "pr-24"
                  : showClearButton || rightIcon || rightAction
                    ? "pr-12"
                    : ""
              }
              ${className}
            `}
            {...props}
          />

          {showClearButton && onClear && (
            <InputClearButton
              onClear={onClear}
              positionClassName={rightAction ? "right-14" : "right-5"}
            />
          )}

          {rightAction && (
            <button
              type="button"
              aria-label={rightAction.label}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={rightAction.onClick}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-semantic-500 disabled:cursor-not-allowed disabled:text-semantic-400"
            >
              {rightAction.icon}
            </button>
          )}

          {!showClearButton && !rightAction && rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-semantic-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>

        {(errorMessage || helperMessage) && (
          <p
            className={`text-b3 ${
              isError ? "text-red-400" : "text-semantic-600"
            }`}
          >
            {errorMessage || helperMessage}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
