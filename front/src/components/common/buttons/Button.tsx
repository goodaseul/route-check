type ButtonState = "blue" | "white";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  buttonBg?: ButtonState;
  disabled?: boolean;
};

export default function Button({
  children,
  onClick,
  buttonBg = "white",
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  const bgStyles =
    buttonBg === "blue"
      ? "bg-blue-500 text-semantic-100 hover:bg-blue-700"
      : "bg-semantic-100 text-semantic-800 hover:bg-semantic-300";
  return (
    <button
      className={`
        rounded-btn px-5 h-14 font-semibold text-b-1
        ${bgStyles}
        disabled:bg-semantic-300 
        disabled:text-semantic-500 
        disabled:hover:bg-semantic-300
      `}
      type={type}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
