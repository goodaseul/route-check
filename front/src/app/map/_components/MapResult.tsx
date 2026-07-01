import { SearchResponse } from "@/api/types/search";
import Image from "next/image";

interface MapResultProps {
  loading: boolean;
  data: SearchResponse | null;
}

export default function MapResult({ loading, data }: MapResultProps) {
  return (
    <>
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
    </>
  );
}
