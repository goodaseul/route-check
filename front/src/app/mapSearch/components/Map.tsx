"use client";

import React, { useEffect, useState } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";

interface PlaceType {
  place_name: string;
  address_name: string;
  road_address_name: string;
  lat: number;
  lng: number;
}

interface MapPageProps {
  keyword: string;
  setKeyword: (value: string) => void;
}

export default function MapPage({ keyword, setKeyword }: MapPageProps) {
  const [showMap, setShowMap] = useState<boolean>(false);
  const [mapKeyword, setMapKeyword] = useState<string>("");
  const [center, setCenter] = useState({ lat: 37.566826, lng: 126.9786567 });
  const [selectedPlace, setSelectedPlace] = useState<PlaceType | null>(null);

  const handleMapSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapKeyword.trim()) return;
    if (!window.kakao?.maps?.services) return;

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(mapKeyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const firstPlace = data[0];
        const newCenter = {
          lat: parseFloat(firstPlace.y),
          lng: parseFloat(firstPlace.x),
        };
        setCenter(newCenter);
        setSelectedPlace({
          place_name: firstPlace.place_name,
          address_name: firstPlace.address_name,
          road_address_name: firstPlace.road_address_name,
          ...newCenter,
        });
      } else {
        alert("검색 결과가 없습니다. 정확한 명칭을 입력해 주세요.");
      }
    });
  };

  const handleMapClick = (
    _target: kakao.maps.Map,
    mouseEvent: kakao.maps.event.MouseEvent,
  ) => {
    const latlng = mouseEvent.latLng;
    const lat = latlng.getLat();
    const lng = latlng.getLng();

    const geocoder = new window.kakao.maps.services.Geocoder();
    const ps = new window.kakao.maps.services.Places();

    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const addressInfo = result[0];
        const addressName = addressInfo.address.address_name;
        const roadAddressName = addressInfo.road_address
          ? addressInfo.road_address.address_name
          : "";

        ps.keywordSearch(
          addressName,
          (places, placeStatus) => {
            let placeName = roadAddressName || addressName;

            if (placeStatus === window.kakao.maps.services.Status.OK) {
              const nearest = places.reduce((prev, curr) => {
                const prevDist =
                  Math.abs(parseFloat(prev.y) - lat) +
                  Math.abs(parseFloat(prev.x) - lng);
                const currDist =
                  Math.abs(parseFloat(curr.y) - lat) +
                  Math.abs(parseFloat(curr.x) - lng);
                return currDist < prevDist ? curr : prev;
              });

              const dist =
                Math.abs(parseFloat(nearest.y) - lat) +
                Math.abs(parseFloat(nearest.x) - lng);

              if (dist < 0.0005) {
                placeName = nearest.place_name;
              }
            }

            setCenter({ lat, lng });
            setSelectedPlace({
              place_name: placeName,
              address_name: addressName,
              road_address_name: roadAddressName,
              lat,
              lng,
            });
          },
          { location: new window.kakao.maps.LatLng(lat, lng), radius: 50 },
        );
      }
    });
  };

  const handleApplyAddress = () => {
    if (!selectedPlace) return;
    const finalAddress =
      selectedPlace.place_name ||
      selectedPlace.road_address_name ||
      selectedPlace.address_name;
    setKeyword(finalAddress);
    setShowMap(false);
  };

  return (
    <div className="w-full max-w-md p-6 bg-white text-black rounded-lg shadow-md mx-auto">
      {/* 상단 input + 지도 열기 버튼 */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="w-full pl-3 pr-8 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-sm focus:outline-none focus:ring-1 focus:ring-yellow-400"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => setKeyword("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label="검색어 삭제"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 font-medium rounded-md text-sm transition-colors text-gray-900 shrink-0"
        >
          {showMap ? "지도 닫기" : "지도 열기"}
        </button>
      </div>

      {/* 지도 영역 */}
      {showMap && (
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3">
          {/* 지도 전용 검색창 */}
          <form onSubmit={handleMapSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="Ex) 강일중학교, 역삼역 맛집"
              value={mapKeyword}
              onChange={(e) => setMapKeyword(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-md text-sm"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-gray-800 text-white rounded-md text-sm hover:bg-gray-700"
            >
              검색
            </button>
          </form>

          <div className="w-full h-64 rounded-md overflow-hidden shadow-inner">
            <Map
              center={center}
              style={{ width: "100%", height: "100%" }}
              level={3}
              onClick={handleMapClick}
            >
              {selectedPlace && (
                <MapMarker
                  position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                >
                  <div className="p-1 text-xs font-semibold text-gray-900 bg-white border rounded shadow whitespace-nowrap">
                    {selectedPlace.place_name}
                  </div>
                </MapMarker>
              )}
            </Map>
          </div>

          {selectedPlace && (
            <div className="pt-2 border-t border-gray-200 space-y-2">
              <div className="text-xs text-gray-600">
                <span className="font-bold text-blue-600">[선택된 위치]</span>{" "}
                {selectedPlace.road_address_name || selectedPlace.address_name}
              </div>
              <button
                type="button"
                onClick={handleApplyAddress}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-sm transition-colors"
              >
                이 위치로 주소 설정하기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
