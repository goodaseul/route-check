"use client";

import Button from "@/components/common/buttons/Button";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import SearchBox from "@/components/common/search-box/SearchBox";
import Inner from "@/components/layout/Inner";
import KakaoMapScriptProvider from "@/providers/KakaoMapScriptProvider";
import { Map as KakaoMap, MapMarker } from "react-kakao-maps-sdk";
import { useState } from "react";
import type { MapPosition, Place } from "../_types";

type KakaoPlacePickerProps = {
  onClose: () => void;
  onSelect: (place: Place) => void;
};

const BUSAN_CENTER: MapPosition = {
  lat: 35.1795543,
  lng: 129.0756416,
};

export default function KakaoPlacePicker({
  onClose,
  onSelect,
}: KakaoPlacePickerProps) {
  return (
    <div className="fixed inset-0 z-50 mx-auto flex w-full max-w-container flex-col bg-semantic-100">
      <KakaoMapScriptProvider>
        <PlacePickerContent onClose={onClose} onSelect={onSelect} />
      </KakaoMapScriptProvider>
    </div>
  );
}

function PlacePickerContent({
  onClose,
  onSelect,
}: KakaoPlacePickerProps) {
  const [keyword, setKeyword] = useState("");
  const [center, setCenter] = useState<MapPosition>(BUSAN_CENTER);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const searchPlace = (value: string) => {
    if (!value || !window.kakao?.maps?.services) return;

    const places = new window.kakao.maps.services.Places();
    places.keywordSearch(value, (results, status) => {
      if (status !== window.kakao.maps.services.Status.OK || !results[0]) {
        setSelectedPlace(null);
        return;
      }

      const result = results[0];
      const position = {
        lat: Number(result.y),
        lng: Number(result.x),
      };

      setCenter(position);
      setSelectedPlace({
        ...position,
        place_name: result.place_name,
        address_name: result.address_name,
        road_address_name: result.road_address_name,
      });
    });
  };

  const selectMapPosition = (
    _map: kakao.maps.Map,
    mouseEvent: kakao.maps.event.MouseEvent,
  ) => {
    const position = {
      lat: mouseEvent.latLng.getLat(),
      lng: mouseEvent.latLng.getLng(),
    };
    const geocoder = new window.kakao.maps.services.Geocoder();

    geocoder.coord2Address(position.lng, position.lat, (results, status) => {
      if (status !== window.kakao.maps.services.Status.OK || !results[0]) {
        return;
      }

      const address = results[0];
      const addressName = address.address.address_name;
      const roadAddressName = address.road_address?.address_name || "";

      setCenter(position);
      setSelectedPlace({
        ...position,
        place_name: roadAddressName || addressName,
        address_name: addressName,
        road_address_name: roadAddressName,
      });
    });
  };

  return (
    <>
      <MenuTitle onAction={onClose}>지도에서 장소 선택</MenuTitle>

      <Inner styles="relative z-10 pb-4 bg-semantic-100">
        <SearchBox
          value={keyword}
          onChange={setKeyword}
          onSearch={searchPlace}
          placeholder="지도에서 찾을 장소를 검색해 주세요"
        />
      </Inner>

      <div className="relative min-h-0 flex-1">
        <KakaoMap
          className="size-full"
          center={center}
          level={4}
          onClick={selectMapPosition}
        >
          {selectedPlace && (
            <MapMarker
              position={{
                lat: selectedPlace.lat,
                lng: selectedPlace.lng,
              }}
            />
          )}
        </KakaoMap>
      </div>

      <div className="relative z-20 bg-semantic-100 px-6 pt-4 pb-6">
        {selectedPlace ? (
          <div className="rounded-card border border-semantic-300 bg-semantic-100 p-5 shadow-card">
            <strong className="block text-b1 font-semibold text-semantic-800">
              {selectedPlace.place_name}
            </strong>
            <p className="mt-1 text-b3 text-semantic-600">
              {selectedPlace.road_address_name ||
                selectedPlace.address_name}
            </p>
            <Button
              buttonBg="blue"
              className="mt-4"
              onClick={() => onSelect(selectedPlace)}
            >
              이 장소 선택
            </Button>
          </div>
        ) : (
          <div className="rounded-card bg-semantic-300 px-5 py-4 text-center">
            <p className="text-b3 text-semantic-600">
              지도에서 원하는 위치를 눌러주세요
            </p>
          </div>
        )}
      </div>
    </>
  );
}
