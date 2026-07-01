import { Map, MapMarker } from "react-kakao-maps-sdk";
import { PlaceType } from "./Map";

interface KakaoMapInputProps {
  mapKeyword: string;
  setMapKeyword: (value: string) => void;
  center: { lat: number; lng: number };
  selectedPlace: PlaceType | null;
  setSelectedPlace: (place: PlaceType | null) => void;
  handleMapSearch: (e: React.FormEvent) => void;
  handleMapClick: (
    _target: kakao.maps.Map,
    mouseEvent: kakao.maps.event.MouseEvent,
  ) => void;
  handleApplyAddress: () => void;
}

export default function KakaoMapInput({
  mapKeyword,
  setMapKeyword,
  center,
  selectedPlace,
  setSelectedPlace,
  handleMapSearch,
  handleMapClick,
  handleApplyAddress,
}: KakaoMapInputProps) {
  return (
    <div className="relative">
      <form onSubmit={handleMapSearch}>
        <input
          type="text"
          placeholder="Ex) 강일중학교, 역삼역 맛집"
          value={mapKeyword}
          onChange={(e) => {
            const value = e.target.value;
            setMapKeyword(e.target.value);
            if (!value.trim()) setSelectedPlace(null);
          }}
        />
        <button type="submit">검색</button>
      </form>

      <div className="absolute left-0 top-full w-full h-64">
        <Map
          className="w-full h-full"
          center={center}
          level={3}
          onClick={handleMapClick}
        >
          {selectedPlace && (
            <MapMarker
              position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
            >
              <div>{selectedPlace.place_name}</div>
            </MapMarker>
          )}
        </Map>
      </div>

      {selectedPlace && (
        <div>
          <div>
            <span>[선택된 위치]</span>{" "}
            {selectedPlace.road_address_name || selectedPlace.address_name}
          </div>
          <button type="button" onClick={handleApplyAddress}>
            이 위치로 주소 설정하기
          </button>
        </div>
      )}
    </div>
  );
}
