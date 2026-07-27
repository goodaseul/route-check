import Image from "next/image";

type PlaceCardProps = {
  imageSrc?: string | null;
  title: string;
  desc: string;
  selected: boolean;
  onClick?: () => void;
};
export default function PlaceCard({
  imageSrc,
  title,
  desc,
  selected,
  onClick,
}: PlaceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-3 rounded-2xl bg-semantic-300 w-52
    text-left transition-colors border-2
    ${selected ? "bg-blue-100 border-blue-500" : "bg-semantic-300 border-transparent"}
    `}
    >
      <div className="relative w-full h-30 mb-3">
        <Image
          src={imageSrc ? imageSrc : "/images/default.svg"}
          alt={`${title} 이미지`}
          fill
          className="object-cover"
        />
      </div>
      <div className="px-2">
        <h3 className="text-b1 text-semantic-800 font-bold truncate">
          {title}
        </h3>
        <p className="text-d1 truncate text-semantic-600">{desc}</p>
      </div>
    </button>
  );
}
