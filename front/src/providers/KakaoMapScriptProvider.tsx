"use client";

import React, { useState } from "react";
import Script from "next/script";

export default function KakaoMapScriptProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadMap = () => {
    if (typeof window !== "undefined" && window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        setIsLoaded(true);
      });
    } else {
      setHasError(true);
    }
  };

  const mapKey = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY;

  if (hasError || !mapKey) {
    return (
      <div className="flex h-full min-h-40 flex-col items-center justify-center gap-2 rounded-card bg-semantic-200 p-6 text-center text-sm text-semantic-600">
        <p className="font-semibold text-semantic-800">지도를 불러올 수 없습니다.</p>
        <p className="text-xs text-semantic-500">네트워크 연결 또는 지도 키 설정을 확인해 주세요.</p>
        <button
          type="button"
          onClick={() => {
            setHasError(false);
            window.location.reload();
          }}
          className="mt-2 rounded-btn bg-semantic-300 px-4 py-2 text-xs font-semibold text-semantic-800 hover:bg-semantic-400"
        >
          새로고침
        </button>
      </div>
    );
  }

  return (
    <>
      {/* react-kakao-maps-sdk 훅 대신 Next.js 공식 스크립트 컴포넌트로 명시적 로드 */}
      <Script
        src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${mapKey}&libraries=services&autoload=false`}
        strategy="afterInteractive"
        onLoad={loadMap}
        onReady={loadMap}
        onError={(e) => {
          console.error("카카오 지도 스크립트 로드 실패", e);
          setHasError(true);
        }}
      />

      {/* 로딩 완료 전에는 안전하게 대기 UI 표시 */}
      {!isLoaded ? (
        <div className="flex h-full min-h-40 items-center justify-center text-sm font-medium text-semantic-600">
          지도를 준비하는 중입니다...
        </div>
      ) : (
        children
      )}
    </>
  );
}
