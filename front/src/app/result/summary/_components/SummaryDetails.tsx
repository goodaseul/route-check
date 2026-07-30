"use client";

import Button from "@/components/common/buttons/Button";
import TitleSm from "@/components/common/title-sm/TitleSm";
import KakaoMapScriptProvider from "@/providers/KakaoMapScriptProvider";
import { usePlanSchedule } from "@/app/plan/_context/PlanScheduleContext";
import { CustomOverlayMap, Map, Polyline, useMap } from "react-kakao-maps-sdk";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

type Position = { lat: number; lng: number };

function FitRoute({ positions }: { positions: Position[] }) {
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

function RouteMap({ positions }: { positions: Position[] }) {
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

type SummaryDetailsProps = {
  isPerfectScore: boolean;
};

export default function SummaryDetails({
  isPerfectScore,
}: SummaryDetailsProps) {
  const router = useRouter();
  const { schedules } = usePlanSchedule();
  const scheduleItems = Object.values(schedules).flat();
  const positions = useMemo(
    () =>
      scheduleItems
        .filter(
          (
            item,
          ): item is typeof item & Required<Pick<typeof item, "lat" | "lng">> =>
            typeof item.lat === "number" && typeof item.lng === "number",
        )
        .map(({ lat, lng }) => ({ lat, lng })),
    [scheduleItems],
  );

  const summary = [
    ["총 이동 거리", "28.4km"],
    ["총 이동 시간", "2시간 45분"],
    ["총 방문 장소 수", `${scheduleItems.length}곳`],
    ["전체 예상 소요 시간 (이동+체류)", "26시간 30분"],
  ];

  return (
    <>
      <dl className="rounded-card border border-semantic-400 bg-semantic-100 px-8 py-3.5 shadow-card">
        {summary.map(([label, value], index) => (
          <div
            key={label}
            className={`flex items-center justify-between py-3 ${
              index < summary.length - 1 ? "border-b border-semantic-400" : ""
            }`}
          >
            <dt className="text-d1 font-medium text-semantic-600">{label}</dt>
            <dd className="text-b3 font-semibold text-semantic-800">{value}</dd>
          </div>
        ))}
      </dl>

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
    </>
  );
}
