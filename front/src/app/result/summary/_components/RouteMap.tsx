"use client";

import { CustomOverlayMap, Map, Polyline, useMap } from "react-kakao-maps-sdk";
import { useEffect } from "react";

export type RoutePosition = { lat: number; lng: number };

function FitRoute({ positions }: { positions: RoutePosition[] }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length < 1) return;

    const bounds = new kakao.maps.LatLngBounds();
    positions.forEach(({ lat, lng }) => {
      bounds.extend(new kakao.maps.LatLng(lat, lng));
    });
    map.setBounds(bounds, 36, 36, 36, 36);
  }, [map, positions]);

  return null;
}

export default function RouteMap({
  positions,
}: {
  positions: RoutePosition[];
}) {
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
