"use client";

import { useSearch } from "@/hooks/queries/features/useSearch";
import { useRecommendations } from "@/hooks/queries/features/useRecommendations";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Place } from "../_types";
import type { PlaceCardItem } from "../_data/recommended-places";

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
  const {
    data: recommendationData,
    isLoading: isRecommendationsLoading,
  } = useRecommendations();
  const isSearchMode = Boolean(searchKeyword);
  const searchPlaces = useMemo<PlaceCardItem[]>(
    () =>
      searchData?.results.map((place) => ({
        id: place.contentid,
        contentId: Number(place.contentid),
        title: place.title,
        desc: [place.addr1, place.addr2].filter(Boolean).join(" "),
        imageSrc: place.firstimage || place.firstimage2 || null,
        lat: Number(place.mapy) || undefined,
        lng: Number(place.mapx) || undefined,
      })) ?? [],
    [searchData],
  );
  const recommendedPlaces = useMemo<PlaceCardItem[]>(
    () =>
      recommendationData?.results
        .map((place) => ({
          id: place.contentid,
          contentId: Number(place.contentid),
          title: place.title,
          desc: [place.addr1, place.addr2].filter(Boolean).join(" "),
          imageSrc: place.firstimage || place.firstimage2 || null,
          lat: Number(place.mapy) || undefined,
          lng: Number(place.mapx) || undefined,
        }))
        .filter((place) => Number.isFinite(place.contentId)) ?? [],
    [recommendationData],
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
    const contentId = createCoordinateContentId(place.lat, place.lng);
    addScheduleItems(day, [
      {
        id: `map-${contentId}`,
        contentId,
        name: place.place_name,
        address: place.road_address_name || place.address_name,
        lat: place.lat,
        lng: place.lng,
      },
    ]);
    router.back();
  };

  const completeSelectedPlaces = () => {
    const currentPlaces = isSearchMode ? searchPlaces : recommendedPlaces;
    const selectedPlaces = currentPlaces
      .filter((place) => selectedIds.includes(place.id))
      .map((place) => ({
        id: place.id,
        contentId: place.contentId,
        name: place.title,
        address: place.desc,
        imageSrc: place.imageSrc,
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
    recommendedPlaces,
    isRecommendationsLoading,
    changeKeyword,
    searchPlacesByKeyword,
    togglePlace,
    openMap: () => setIsMapOpen(true),
    closeMap: () => setIsMapOpen(false),
    addMapPlace,
    completeSelectedPlaces,
  };
}

function createCoordinateContentId(lat: number, lng: number) {
  const latPart = Math.round(Math.abs(lat) * 10_000);
  const lngPart = Math.round(Math.abs(lng) * 10_000);
  return -(latPart * 10_000_000 + lngPart);
}
