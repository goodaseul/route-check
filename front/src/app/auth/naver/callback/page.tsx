// src/app/auth/naver/callback/page.tsx
"use client";

import { useEffect } from "react";
import fetchLoginNaver from "@/api/loginNaver";
import { NaverLoginInstance } from "@/types/naver";
import { LoginResponse } from "@/api/types/auth";

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
      const naverLogin = new window.naver.LoginWithNaverId({
        clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!,
        callbackUrl: `${window.location.origin}/auth/naver/callback`,
        isPopup: true,
        callbackHandle: true,
      });
      naverLogin.init();
      handleLoginStatus(naverLogin);
    }

    if (document.getElementById("naver-login-sdk")) {
      initNaverLogin();
      return;
    }

    const script = document.createElement("script");
    script.id = "naver-login-sdk";
    script.src = "https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js";
    script.async = true;
    script.onload = initNaverLogin;
    document.head.appendChild(script);
  }, []);

  return null;
}
