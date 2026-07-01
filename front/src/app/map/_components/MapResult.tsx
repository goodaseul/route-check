import { SearchResponse } from "@/api/types/search";
import Image from "next/image";

interface MapResultProps {
  loading: boolean;
  data: SearchResponse | null;
}

export default function MapResult({ loading, data }: MapResultProps) {
  return (
    <>
      {loading && <p>검색 중...</p>}
      {data && data.results.length > 0 && (
        <>
          <p>총 {data?.total_count}개 결과</p>
          {data?.results.map((item) => (
            <div key={item.contentid}>
              {item.firstimage2 && (
                <div
                  style={{
                    position: "relative",
                    width: "80px",
                    height: "80px",
                  }}
                >
                  <Image
                    src={item.firstimage2}
                    alt={item.title}
                    fill
                    sizes="80px"
                    style={{ objectFit: "cover", borderRadius: "6px" }}
                  />
                </div>
              )}
              <div>
                <h3>{item.title}</h3>
                <p>
                  {item.addr1} {item.addr2}
                </p>
                {item.tel && <p>{item.tel}</p>}
              </div>
            </div>
          ))}
        </>
      )}
    </>
  );
}
