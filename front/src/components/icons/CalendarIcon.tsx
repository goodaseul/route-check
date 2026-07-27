type IconProps = {
  className?: string;
};

export default function CalendarIcon({ className = "" }: IconProps) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M8 6V3.5M16 6V3.5"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 5H18.5C19.8807 5 21 6.11929 21 7.5V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V7.5C3 6.11929 4.11929 5 5.5 5Z"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 9.5H21"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
