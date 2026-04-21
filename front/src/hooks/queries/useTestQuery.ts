import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../queryKey";
import { fetchTourTest } from "@/api/test";

export const useTestQuery = () => {
  return useQuery({
    queryKey: queryKeys.tour.test,
    queryFn: fetchTourTest,
  });
};
