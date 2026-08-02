import { Check } from "lucide-react";

type ResultStateStatus = "success" | "error";

type ResultStateProps = {
  status: ResultStateStatus;
  title: string;
  description: string;
  className?: string;
};

export default function ResultState({
  status,
  title,
  description,
  className = "",
}: ResultStateProps) {
  const isSuccess = status === "success";

  return (
    <section
      role={isSuccess ? "status" : "alert"}
      className={`flex flex-col items-center justify-center text-center ${className}`}
    >
      <span
        className={`center size-14 rounded-full ${
          isSuccess
            ? "bg-green-100 text-green-500"
            : "bg-[#fff0e9] text-orange"
        }`}
        aria-hidden="true"
      >
        {isSuccess ? (
          <Check size={28} strokeWidth={2.5} />
        ) : (
          <span className="text-[28px] font-semibold leading-none">!</span>
        )}
      </span>

      <h1 className="mt-6 text-h3 font-bold text-semantic-800">{title}</h1>
      <p className="mt-2 text-b3 text-semantic-600">{description}</p>
    </section>
  );
}
