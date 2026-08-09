"use client";

import { useSearch } from "@/hooks/queries/features/useSearch";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Place } from "../_types";
import {
  RECOMMENDED_PLACES,
  type PlaceCardItem,
} from "../_data/recommended-places";

export function useMapSearchPage(day: string) {
  const router = useRouter();
  const addScheduleItems = usePlanScheduleStore(
    (state) => state.addScheduleItems,
  );
  const [keyword, setKeyword] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const { data: searchData, isLoading } = useSearch({
    keyword: searchKeyword,
  });
  const isSearchMode = Boolean(searchKeyword);
  const searchPlaces = useMemo<PlaceCardItem[]>(
    () =>
      searchData?.results.map((place) => ({
        id: place.contentid,
        title: place.title,
        desc: [place.addr1, place.addr2].filter(Boolean).join(" "),
        imageSrc: place.firstimage || place.firstimage2 || null,
        lat: Number(place.mapy) || undefined,
        lng: Number(place.mapx) || undefined,
      })) ?? [],
    [searchData],
  );

  const togglePlace = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  };

  const changeKeyword = (value: string) => {
    setKeyword(value);
    if (!value.trim()) {
      setSearchKeyword("");
      setSelectedIds([]);
    }
  };

  const searchPlacesByKeyword = (value: string) => {
    setSearchKeyword(value);
    setSelectedIds([]);
  };

  const addMapPlace = (place: Place) => {
    addScheduleItems(day, [
      {
        id: `map-${place.lat}-${place.lng}`,
        name: place.place_name,
        lat: place.lat,
        lng: place.lng,
      },
    ]);
    router.back();
  };

  const completeSelectedPlaces = () => {
    const currentPlaces = isSearchMode ? searchPlaces : RECOMMENDED_PLACES;
    const selectedPlaces = currentPlaces
      .filter((place) => selectedIds.includes(place.id))
      .map((place) => ({
        id: place.id,
        name: place.title,
        lat: place.lat,
        lng: place.lng,
      }));

    addScheduleItems(day, selectedPlaces);
    router.back();
  };

  return {
    keyword,
    selectedIds,
    isMapOpen,
    isSearchMode,
    searchData,
    isLoading,
    searchPlaces,
    changeKeyword,
    searchPlacesByKeyword,
    togglePlace,
    openMap: () => setIsMapOpen(true),
    closeMap: () => setIsMapOpen(false),
    addMapPlace,
    completeSelectedPlaces,
  };
}
