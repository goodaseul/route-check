"use client";

import Button from "@/components/common/buttons/Button";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import SearchBox from "@/components/common/search-box/SearchBox";
import Inner from "@/components/layout/Inner";
import KakaoMapScriptProvider from "@/providers/KakaoMapScriptProvider";
import { Map as KakaoMap, MapMarker } from "react-kakao-maps-sdk";
import type { Place } from "../_types";
import { useKakaoPlacePicker } from "../_hooks/useKakaoPlacePicker";

type KakaoPlacePickerProps = {
  onClose: () => void;
  onSelect: (place: Place) => void;
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
  const {
    keyword,
    setKeyword,
    center,
    selectedPlace,
    searchPlace,
    selectMapPosition,
  } = useKakaoPlacePicker();

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
