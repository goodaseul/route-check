import BottomActionBar from "@/components/common/buttons/BottomActionBar";
import TitleSm from "@/components/common/title-sm/TitleSm";
import KakaoMapScriptProvider from "@/providers/KakaoMapScriptProvider";
import RouteMap, { type RoutePosition } from "./RouteMap";

type RoutePreviewViewProps = {
  positions: RoutePosition[];
  isPerfectScore: boolean;
  onContinue: () => void;
  onViewSuggestion: () => void;
  onSave: () => void;
};

export default function RoutePreviewView({
  positions,
  isPerfectScore,
  onContinue,
  onViewSuggestion,
  onSave,
}: RoutePreviewViewProps) {
  return (
    <section className="pt-14 pb-6">
      <TitleSm>이동 미리보기</TitleSm>
      <div className="mt-6 overflow-hidden rounded-t-card bg-semantic-300">
        <div className="relative h-52">
          {positions.length > 0 ? (
            <KakaoMapScriptProvider>
              <RouteMap positions={positions} />
            </KakaoMapScriptProvider>
          ) : (
            <div className="center h-full px-6 text-center text-b3 text-semantic-600">
              좌표가 있는 장소를 추가하면 이동 경로가 표시돼요.
            </div>
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-linear-to-b from-transparent to-semantic-100"
          />
        </div>
        <BottomActionBar
          className="static p-0"
          secondaryAction={
            isPerfectScore
              ? undefined
              : {
                  label: "이대로 진행",
                  buttonBg: "white",
                  onClick: onContinue,
                }
          }
          primaryAction={
            isPerfectScore
              ? {
                  label: "저장하기",
                  buttonBg: "blue",
                  onClick: onSave,
                }
              : {
                  label: "제안 보기",
                  buttonBg: "blue",
                  onClick: onViewSuggestion,
                }
          }
        />
      </div>
    </section>
  );
}
