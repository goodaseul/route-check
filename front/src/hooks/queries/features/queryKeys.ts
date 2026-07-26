export const searchKeys = {
  all: ["search"] as const,
  keyword: (keyword: string) => [...searchKeys.all, keyword] as const,
};
