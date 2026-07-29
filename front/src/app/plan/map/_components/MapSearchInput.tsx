type MapSearchInputProps = {
  keyword: string;
  setKeyword: (keyword: string) => void;
};

export default function MapSearchInput({
  keyword,
  setKeyword,
}: MapSearchInputProps) {
  return (
    <div className="relative flex items-center justify-between">
      <input
        className="w-[80%]"
        type="text"
        placeholder="검색어를 입력하세요"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      {keyword && (
        <button
          className="absolute -right-5"
          type="button"
          onClick={() => setKeyword("")}
          aria-label="검색어 삭제"
        >
          X
        </button>
      )}
    </div>
  );
}
