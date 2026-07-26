// src/app/auth/naver/callback/page.tsx
"use client";

import { useEffect } from "react";
import fetchLoginNaver from "@/api/loginNaver";
import { NaverLoginInstance } from "@/types/naver";
import { LoginResponse } from "@/api/types/auth";
import { loadNaverSdk } from "@/lib/naver/loadNaverSdk";

export default function NaverCallback() {
  useEffect(() => {
    function handleLoginStatus(naverLogin: NaverLoginInstance) {
      naverLogin.getLoginStatus(async (status: boolean) => {
        if (status) {
          const user = naverLogin.user;
          const result: LoginResponse = await fetchLoginNaver({
            auth_provider: "naver",
            provider_user_id: user.getId(),
            email: user.getEmail(),
            name: user.getName(),
            nickname: user.getNickName(),
            profile_image: user.getProfileImage(),
          });

          //   console.log("네이버 로그인 성공:", result);

          if (window.opener) {
            window.opener.postMessage(
              { type: "NAVER_LOGIN_SUCCESS", payload: result },
              window.location.origin,
            );
            window.close();
          }
          return result;
        }
      });
    }

    function initNaverLogin() {
      const naverLogin = new window.naver!.LoginWithNaverId({
        clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!,
        callbackUrl: `${window.location.origin}/auth/naver/callback`,
        isPopup: true,
        callbackHandle: true,
      });
      naverLogin.init();
      handleLoginStatus(naverLogin);
    }

    loadNaverSdk().then(initNaverLogin).catch((error: unknown) => {
      console.error("네이버 로그인 콜백 초기화 실패:", error);
    });
  }, []);

  return null;
}
