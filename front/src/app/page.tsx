"use client";

import GoogleLogin from "./components/features/login/GoogleLogin";
import NaverLogin from "./components/features/login/NaverLogin";

export default function Home() {
  return (
    <div className="">
      <main className="py-32 px-16">
        <div className="flex items-center gap-2">
          <GoogleLogin />
          <NaverLogin
            onLoginSuccess={(result) => {
              console.log("메인 화면에서 로그인 결과 받음:", result);
              // 여기서 로그인 상태 저장 (전역 상태, localStorage에 토큰 저장 등)
              // 화면도 "로그인됨" 상태로 바뀌게
            }}
          />
        </div>
      </main>
    </div>
  );
}
