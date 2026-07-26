type InputClearButtonProps = {
  onClear: () => void;
  positionClassName?: string;
};

export default function InputClearButton({
  onClear,
  positionClassName = "right-5",
}: InputClearButtonProps) {
  return (
    <button
      type="button"
      aria-label="입력 내용 지우기"
      tabIndex={-1}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClear}
      className={`
        absolute top-1/2 -translate-y-1/2 ${positionClassName}
        flex h-5 w-5 items-center justify-center rounded-full
        bg-semantic-500 text-semantic-400
      `}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden="true">
        <path
          d="M1 1L7 7M7 1L1 7"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
