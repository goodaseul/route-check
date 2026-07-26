import Image from "next/image";

type ScoreMood = "great" | "good" | "normal" | "bad";

type MoodStyle = {
  iconImageSrc: string;
  label: string;
};

type ScoreCardProps = {
  score: number;
  maxScore?: number;
  deduction?: number;
  description: string;
};

function getMoodByScore(score: number, maxScore: number): ScoreMood {
  const ratio = score / maxScore;
  if (ratio >= 0.9) return "great";
  if (ratio >= 0.7) return "good";
  if (ratio >= 0.5) return "normal";
  return "bad";
}

const MOOD_STYLES: Record<ScoreMood, MoodStyle> = {
  great: {
    iconImageSrc: "/images/great.svg",
    label: "매우 좋은 점수",
  },
  good: {
    iconImageSrc: "/images/good.svg",
    label: "좋은 점수",
  },
  normal: {
    iconImageSrc: "/images/normal.svg",
    label: "보통 점수",
  },
  bad: {
    iconImageSrc: "/images/bad.svg",
    label: "낮은 점수",
  },
};

export default function ScoreCard({
  score,
  maxScore = 100,
  deduction = 0,
  description,
}: ScoreCardProps) {
  const mood = getMoodByScore(score, maxScore);
  const moodStyle = MOOD_STYLES[mood];

  return (
    <div className="flex items-center justify-between bg-semantic-100 border border-semantic-300 rounded-card px-8 py-7">
      <div className="flex flex-col">
        <div className="flex items-end gap-2.5">
          <span className="text-[40px] font-bold text-semantic-800 leading-none">
            {score}
          </span>
          <span className="text-b1 text-semantic-500 font-semibold">
            / {maxScore}
          </span>
          <span className="flex items-center text-d1 font-semibold text-semantic-500 bg-semantic-300 rounded-full px-2 h-5">
            - {deduction}
          </span>
        </div>
        <p className="text-b3 text-semantic-600 mt-3">{description}</p>
      </div>

      <Image
        src={moodStyle.iconImageSrc}
        width={36}
        height={36}
        alt={moodStyle.label}
      />
    </div>
  );
}
