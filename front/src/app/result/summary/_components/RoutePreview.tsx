"use client";

import { useRouter } from "next/navigation";
import type { RoutePosition } from "./RouteMap";
import RoutePreviewView from "./RoutePreviewView";

type RoutePreviewProps = {
  positions: RoutePosition[];
  isPerfectScore: boolean;
};

export default function RoutePreview(props: RoutePreviewProps) {
  const router = useRouter();

  return (
    <RoutePreviewView
      {...props}
      onContinue={() => router.push("/result/")}
      onViewSuggestion={() => router.push("/result/suggestion")}
      onSave={() => {
        // TODO: 저장 API 연동
      }}
    />
  );
}
