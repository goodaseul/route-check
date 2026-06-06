"use client";
import fetchSearch from "@/api/search";
import { SearchResponse } from "@/api/types/search";
import KakaoMapScriptProvider from "@/providers/KakaoMapScriptProvider";
import Image from "next/image";
import { useEffect, useState } from "react";
import MapPage from "./_components/Map";

export default function MapSearchPage() {
  const [data, setData] = useState<SearchResponse | null>(null);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!keyword.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await fetchSearch(keyword);
        setData(result);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  return (
    <div className="w-full max-w-md mx-auto mt-10 space-y-4">
      {/* 검색 input + 지도는 MapPage 안에 있는 UI 그대로 활용 */}
      <KakaoMapScriptProvider>
        <MapPage keyword={keyword} setKeyword={setKeyword} />
      </KakaoMapScriptProvider>

      {/* 투어 API 결과 리스트 */}
      {loading && <p className="text-sm text-gray-500">검색 중...</p>}
      {data && (
        <p className="text-sm text-gray-600">총 {data.total_count}개 결과</p>
      )}
      {data?.results.map((item) => (
        <div
          key={item.contentid}
          className="flex gap-3 p-3 border border-gray-200 rounded-lg bg-white shadow-sm"
        >
          {item.firstimage2 && (
            <div className="relative w-20 h-20 shrink-0">
              <Image
                src={item.firstimage2}
                alt={item.title}
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}
          <div className="flex flex-col justify-center gap-1">
            <h3 className="text-sm font-semibold text-gray-900">
              {item.title}
            </h3>
            <p className="text-xs text-gray-500">
              {item.addr1} {item.addr2}
            </p>
            {item.tel && <p className="text-xs text-gray-400">{item.tel}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
