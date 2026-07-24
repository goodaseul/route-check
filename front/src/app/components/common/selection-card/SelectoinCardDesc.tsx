import ArrowIcon from "../../icons/ArrowIcon";

type SelectionCardDescProps = {
  title: string;
  desc: string;
};

export default function SelectionCardDesc({
  title,
  desc,
}: SelectionCardDescProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div>
        <p className="text-b1 font-semibold text-semantic-800 group-hover:text-semantic-100 transition-colors">
          {title}
        </p>
        <p className="text-b3 text-semantic-600 group-hover:text-semantic-100/80 transition-colors mt-0.5">
          {desc}
        </p>
      </div>

      <ArrowIcon className="w-6 h-6 text-semantic-400 group-hover:text-semantic-100 transition-colors shrink-0" />
    </div>
  );
}
