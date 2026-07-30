"use client";

import { useRouter } from "next/navigation";
import type { RoutePosition } from "./RouteMap";
import RoutePreviewView from "./RoutePreviewView";

type RoutePreviewProps = {
  positions: RoutePosition[];
  isPerfectScore: boolean;
  date: string | null;
};

export default function RoutePreview({ date, ...props }: RoutePreviewProps) {
  const router = useRouter();
  const suggestionParams = new URLSearchParams();
  if (date) suggestionParams.set("date", date);
  const suggestionQuery = suggestionParams.toString();

  return (
    <RoutePreviewView
      {...props}
      onContinue={() => router.push("/result/")}
      onViewSuggestion={() =>
        router.push(
          `/result/suggestion${suggestionQuery ? `?${suggestionQuery}` : ""}`,
        )
      }
      onSave={() => {
        // TODO: 저장 API 연동
      }}
    />
  );
}
