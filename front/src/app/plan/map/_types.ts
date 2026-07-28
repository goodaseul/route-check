export type MapPosition = {
  lat: number;
  lng: number;
};

export type Place = MapPosition & {
  place_name: string;
  address_name: string;
  road_address_name: string;
};
