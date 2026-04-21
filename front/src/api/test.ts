import { fetcher } from "./fetcher";
import { LocationBasedResponse } from "./types/test";

export const fetchTourTest = async (): Promise<LocationBasedResponse> => {
  return fetcher(`/areaBasedList2`);
};
