"use client";

import React, { useState } from "react";
import MapSearchInput from "./MapSearchInput";
import KakaoMapInput from "./KakaoMapInput";

export interface PlaceType {
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
    <div>
      <MapSearchInput keyword={keyword} setKeyword={setKeyword} />
      <div>
        <button type="button" onClick={() => setShowMap(!showMap)}>
          {showMap ? "지도 닫기" : "지도 열기"}
        </button>
      </div>
      {showMap && (
        <KakaoMapInput
          mapKeyword={mapKeyword}
          setMapKeyword={setMapKeyword}
          center={center}
          selectedPlace={selectedPlace}
          setSelectedPlace={setSelectedPlace}
          handleMapSearch={handleMapSearch}
          handleMapClick={handleMapClick}
          handleApplyAddress={handleApplyAddress}
        />
      )}
    </div>
  );
}
