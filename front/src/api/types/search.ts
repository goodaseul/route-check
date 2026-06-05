export interface SearchResult {
  title: string;
  addr1: string;
  addr2: string;
  zipcode: string;
  contentid: string;
  contenttypeid: string;
  createdtime: string;
  modifiedtime: string;
  firstimage: string;
  firstimage2: string;
  cpyrhtDivCd: string;
  mapx: string;
  mapy: string;
  mlevel: string;
  tel: string;
  lDongRegnCd: string;
  lDongSignguCd: string;
  lclsSystm1: string;
  lclsSystm2: string;
  lclsSystm3: string;
}

export interface SearchResponse {
  keyword: string;
  total_count: number;
  results: SearchResult[];
}
