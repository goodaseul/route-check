export const searchKeys = {
  all: ["search"] as const,
  keyword: (keyword: string) => [...searchKeys.all, keyword] as const,
};

export const recommendationKeys = {
  all: ["recommendations"] as const,
  list: (areaCode?: string) => [...recommendationKeys.all, areaCode] as const,
};

export const transitKeys = {
  all: ["transit"] as const,
  segment: (
    originId: number,
    destinationId: number,
    mode: string,
    coordinates: readonly number[],
  ) => [
    ...transitKeys.all,
    originId,
    destinationId,
    mode,
    ...coordinates,
  ] as const,
};
