"use client";
import KakaoMapScriptProvider from "@/providers/KakaoMapScriptProvider";
import { useState } from "react";
import MapPage from "./_components/Map";
import MapResult from "./_components/MapResult";
import { useSearch } from "@/hooks/queries/features/useSearch";
import { useDebounced } from "@/hooks/useDebounced";

export default function MapSearchPage() {
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounced(keyword, 300);

  const { data, isLoading } = useSearch({ keyword: debouncedKeyword });

  return (
    <div className="w-full max-w-md mx-auto mt-10 space-y-4">
      <KakaoMapScriptProvider>
        <MapPage keyword={keyword} setKeyword={setKeyword} />
      </KakaoMapScriptProvider>
      <MapResult loading={isLoading} data={data ?? null} />
    </div>
  );
}
