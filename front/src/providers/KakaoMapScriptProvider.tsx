"use client";

import React, { useState } from "react";
import Script from "next/script";

export default function KakaoMapScriptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <>
      {/* react-kakao-maps-sdk 훅 대신 Next.js 공식 스크립트 컴포넌트로 명시적 로드 */}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_KEY}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={() => {
          // 카카오 지도가 완전히 준비되면 전역 로드 콜백 실행
          window.kakao.maps.load(() => {
            setIsLoaded(true);
          });
        }}
        onError={(e) => {
          console.error("카카오 지도 스크립트 로드 실패", e);
        }}
      />

      {/* 로딩 완료 전에는 안전하게 대기 UI 표시 */}
      {!isLoaded ? (
        <div className="flex items-center justify-center min-h-screen text-gray-500 text-sm font-medium">
          지도를 준비하는 중입니다...
        </div>
      ) : (
        children
      )}
    </>
  );
}
