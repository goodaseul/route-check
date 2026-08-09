export type PlaceCardItem = {
  id: string;
  title: string;
  desc: string;
  imageSrc: string | null;
  lat?: number;
  lng?: number;
};

export const RECOMMENDED_PLACES: PlaceCardItem[] = [
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
