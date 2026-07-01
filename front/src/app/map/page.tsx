"use client";
import fetchSearch from "@/api/search";
import { SearchResponse } from "@/api/types/search";
import KakaoMapScriptProvider from "@/providers/KakaoMapScriptProvider";
import { useEffect, useState } from "react";
import MapPage from "./_components/Map";
import MapResult from "./_components/MapResult";
import { useDebounced } from "../../../hooks/useDebounced";

export default function MapSearchPage() {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const debouncedKeyword = useDebounced(keyword, 300);

  useEffect(() => {
    if (!debouncedKeyword.trim()) return;

    const search = async () => {
      setLoading(true);
      try {
        const result = await fetchSearch(debouncedKeyword);
        setData(result);
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [debouncedKeyword]);

  return (
    <div className="w-full max-w-md mx-auto mt-10 space-y-4">
      <KakaoMapScriptProvider>
        <MapPage keyword={keyword} setKeyword={setKeyword} />
      </KakaoMapScriptProvider>
      <MapResult loading={loading} data={data} />
    </div>
  );
}
