"use client";

import { useState } from "react";
import type { MapPosition, Place } from "../_types";

const BUSAN_CENTER: MapPosition = {
  lat: 35.1795543,
  lng: 129.0756416,
};

export function useKakaoPlacePicker() {
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
      if (status !== window.kakao.maps.services.Status.OK || !results[0]) return;

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

  return {
    keyword,
    setKeyword,
    center,
    selectedPlace,
    searchPlace,
    selectMapPosition,
  };
}
