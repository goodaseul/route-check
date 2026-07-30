"use client";

import Button from "@/components/common/buttons/Button";
import MenuTitle from "@/components/common/menu-title/MenuTitle";
import PlaceCard from "@/components/common/place-card/PlaceCard";
import SearchBox from "@/components/common/search-box/SearchBox";
import Inner from "@/components/layout/Inner";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import KakaoPlacePicker from "./KakaoPlacePicker";
import type { Place } from "../_types";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";
import { useSearch } from "@/hooks/queries/features/useSearch";
import Checkbox from "@/components/common/checkbox/Checkbox";

type PlaceCardItem = {
  id: string;
  title: string;
  desc: string;
  imageSrc: string | null;
  lat?: number;
  lng?: number;
};

const RECOMMENDED_PLACES: PlaceCardItem[] = [
  {
    id: "haeundae",
    title: "해운대 해수욕장",
    desc: "부산 해운대구",
    imageSrc: null,
    lat: 35.1587,
    lng: 129.1604,
  },
  {
    id: "gwangalli",
    title: "광안리 해수욕장",
    desc: "부산 수영구",
    imageSrc: null,
    lat: 35.1532,
    lng: 129.1187,
  },
  {
    id: "gamcheon",
    title: "감천문화마을",
    desc: "부산 사하구",
    imageSrc: null,
    lat: 35.0974,
    lng: 129.0106,
  },
  {
    id: "seokbulsa",
    title: "석불사",
    desc: "부산 북구",
    imageSrc: null,
    lat: 35.2197,
    lng: 129.0511,
  },
];

type MapSearchPageClientProps = {
  day: string;
};

export default function MapSearchPageClient({ day }: MapSearchPageClientProps) {
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
  const searchPlaces: PlaceCardItem[] =
    searchData?.results.map((place) => ({
      id: place.contentid,
      title: place.title,
      desc: [place.addr1, place.addr2].filter(Boolean).join(" "),
      imageSrc: place.firstimage || place.firstimage2 || null,
      lat: Number(place.mapy) || undefined,
      lng: Number(place.mapx) || undefined,
    })) || [];

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
    const id = `map-${place.lat}-${place.lng}`;
    addScheduleItems(day, [{
      id,
      name: place.place_name,
      lat: place.lat,
      lng: place.lng,
    }]);
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

  return (
    <div className="flex min-h-dvh flex-col">
      <MenuTitle>장소 검색</MenuTitle>

      <Inner styles="flex flex-1 flex-col">
        <main className="flex flex-1 flex-col pb-8">
          <SearchBox
            value={keyword}
            onChange={changeKeyword}
            onSearch={searchPlacesByKeyword}
            placeholder="장소명, 키워드 검색 (예: 해운대, 광안리)"
          />

          <button
            type="button"
            onClick={() => setIsMapOpen(true)}
            className="mt-6 flex w-full items-center gap-3 rounded-2xl bg-semantic-300 px-7 py-6 text-left"
          >
            <Image
              src="/images/icons/map-spot.svg"
              width={32}
              height={32}
              alt=""
              aria-hidden="true"
              className="size-8 shrink-0"
            />
            <span>
              <strong className="block text-b2 font-semibold text-semantic-800">
                원하는 장소가 없으신가요
              </strong>
              <span className="block text-b2 font-semibold text-green-500">
                버튼을 통해 지도에서 직접 선택해 보세요
              </span>
            </span>
          </button>

          <section className="mt-12 flex flex-1 flex-col">
            <h2 className="text-h2 font-bold text-semantic-800 mb-5">
              {isSearchMode ? (
                <>
                  검색결과{" "}
                  <span className="text-h3 font-semibold text-blue-500">
                    ({searchData?.total_count || 0})
                  </span>
                </>
              ) : (
                "추천장소"
              )}
            </h2>

            {isSearchMode ? (
              isLoading ? (
                <div className="py-16 text-center text-b2 text-semantic-600">
                  검색 중...
                </div>
              ) : searchPlaces.length > 0 ? (
                <ul className="">
                  {searchPlaces.map((place) => {
                    const isSelected = selectedIds.includes(place.id);

                    return (
                      <li
                        key={place.id}
                        className="flex items-center border-b border-semantic-400"
                      >
                        <button
                          type="button"
                          onClick={() => togglePlace(place.id)}
                          className="min-w-0 flex-1 py-5 text-left"
                        >
                          <span className="min-w-0 flex-1">
                            <strong className="block truncate text-b1 font-bold text-semantic-800">
                              {place.title}
                            </strong>
                            <span className="block truncate text-d1 text-semantic-600">
                              {place.desc}
                            </span>
                          </span>
                        </button>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => togglePlace(place.id)}
                          aria-label={`${place.title} 선택`}
                        />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="flex py-26.5 flex-1 flex-col items-center justify-start pt-32 text-center">
                  <p className="text-h3-sm font-semibold text-semantic-800">
                    검색 결과가 없어요
                  </p>
                  <p className="mt-1.5 text-b1 text-semantic-600">
                    다른 키워드로 검색하거나
                    <br />
                    지도에서 직접 선택해 보세요
                  </p>
                </div>
              )
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {RECOMMENDED_PLACES.map((place) => (
                  <PlaceCard
                    key={place.id}
                    imageSrc={place.imageSrc}
                    title={place.title}
                    desc={place.desc}
                    selected={selectedIds.includes(place.id)}
                    onClick={() => togglePlace(place.id)}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </Inner>

      <div className="sticky bottom-0 z-30 mt-auto bg-semantic-100 px-6 pt-4 pb-6">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-14 right-0 left-0 h-14 bg-linear-to-b from-transparent to-semantic-100"
        />
        <Button
          buttonBg="blue"
          disabled={selectedIds.length === 0}
          onClick={completeSelectedPlaces}
        >
          선택 완료
          {isSearchMode && ` (${selectedIds.length}개)`}
        </Button>
      </div>

      {isMapOpen && (
        <KakaoPlacePicker
          onClose={() => setIsMapOpen(false)}
          onSelect={addMapPlace}
        />
      )}
    </div>
  );
}
