"use client";

import Button from "@/components/common/buttons/Button";
import TitleSm from "@/components/common/title-sm/TitleSm";
import KakaoMapScriptProvider from "@/providers/KakaoMapScriptProvider";
import { CustomOverlayMap, Map, Polyline, useMap } from "react-kakao-maps-sdk";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export type RoutePosition = { lat: number; lng: number };

function FitRoute({ positions }: { positions: RoutePosition[] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 1) return;
    const bounds = new kakao.maps.LatLngBounds();
    positions.forEach(({ lat, lng }) =>
      bounds.extend(new kakao.maps.LatLng(lat, lng)),
    );
    map.setBounds(bounds, 36, 36, 36, 36);
  }, [map, positions]);

  return null;
}

function RouteMap({ positions }: { positions: RoutePosition[] }) {
  const center = positions[0] ?? { lat: 35.1796, lng: 129.0756 };

  return (
    <Map center={center} level={7} className="h-52 w-full">
      <FitRoute positions={positions} />
      {positions.length > 1 && (
        <Polyline
          path={positions}
          strokeWeight={5}
          strokeColor="#2087ff"
          strokeOpacity={0.9}
          strokeStyle="solid"
        />
      )}
      {positions.map((position, index) => (
        <CustomOverlayMap
          key={`${position.lat}-${position.lng}-${index}`}
          position={position}
          xAnchor={0.5}
          yAnchor={0.5}
        >
          <span className="center size-7 rounded-full border-2 border-white bg-blue-500 text-d1 font-bold text-white shadow-md">
            {index + 1}
          </span>
        </CustomOverlayMap>
      ))}
    </Map>
  );
}

type RoutePreviewProps = {
  positions: RoutePosition[];
  isPerfectScore: boolean;
};

export default function RoutePreview({
  positions,
  isPerfectScore,
}: RoutePreviewProps) {
  const router = useRouter();

  return (
    <section className="pt-14 pb-6">
      <TitleSm>이동 미리보기</TitleSm>
      <div className="mt-6 overflow-hidden rounded-t-card bg-semantic-300">
        <div className="relative h-52">
          {positions.length > 0 ? (
            <KakaoMapScriptProvider>
              <RouteMap positions={positions} />
            </KakaoMapScriptProvider>
          ) : (
            <div className="center h-full px-6 text-center text-b3 text-semantic-600">
              좌표가 있는 장소를 추가하면 이동 경로가 표시돼요.
            </div>
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-linear-to-b from-transparent to-semantic-100"
          />
        </div>
        <div
          className={`grid bg-semantic-100 ${
            isPerfectScore ? "grid-cols-1" : "grid-cols-2 gap-3"
          }`}
        >
          {isPerfectScore ? (
            <Button buttonBg="blue">저장하기</Button>
          ) : (
            <>
              <Button onClick={() => router.push("/plan/schedule")}>
                이대로 진행
              </Button>
              <Button
                buttonBg="blue"
                onClick={() => router.push("/result/suggestion")}
              >
                제안 보기
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
