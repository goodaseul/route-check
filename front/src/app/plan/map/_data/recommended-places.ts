export type PlaceCardItem = {
  id: string;
  contentId: number;
  title: string;
  desc: string;
  imageSrc: string | null;
  lat?: number;
  lng?: number;
};
