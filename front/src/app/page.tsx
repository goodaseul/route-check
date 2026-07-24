// "use client";

import SelectionCard from "./components/common/selection-card/SelectionCard";
import SelectionCardDesc from "./components/common/selection-card/SelectoinCardDesc";

// import GoogleLogin from "./components/features/login/GoogleLogin";
// import NaverLogin from "./components/features/login/NaverLogin";

export default function Home() {
  return (
    <div className="">
      <div className="flex flex-col gap-4 p-6">
        {/* 1번 카드: Plan (기본 -> Hover시 Blue) */}
        <SelectionCard type="plan">
          <SelectionCardDesc
            title="여행 계획이 있어요"
            desc="계획한 일정을 분석해드릴게요"
          />
        </SelectionCard>

        {/* 2번 카드: Date (기본 -> Hover시 Green) */}
        <SelectionCard type="date">
          <SelectionCardDesc
            title="여행 날짜만 정했어요"
            desc="날짜를 기준으로 일정을 구성할게요"
          />
        </SelectionCard>
      </div>
      {/* <div className="flex items-center gap-2">
          <GoogleLogin />
          <NaverLogin
            onLoginSuccess={(result) => {
              console.log("메인 화면에서 로그인 결과 받음:", result);
              // 여기서 로그인 상태 저장 (전역 상태, localStorage에 토큰 저장 등)
              // 화면도 "로그인됨" 상태로 바뀌게
            }}
          />
        </div> */}
    </div>
  );
}
