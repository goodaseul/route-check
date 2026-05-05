import { API_PATHS } from "@/constants/api-paths";
import { fetcher } from "./fetcher";
import { LocationBasedResponse } from "./types/test";

export const fetchTourTest = async (): Promise<LocationBasedResponse> => {
  return fetcher<LocationBasedResponse>(API_PATHS.tour.areaList);
};
