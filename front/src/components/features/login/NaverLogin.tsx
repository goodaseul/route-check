"use client";

import { useEffect } from "react";
import { LoginResponse } from "@/api/types/auth";
import LoginButton from "@/components/common/buttons/LoginButton";

type NaverLoginProps = {
  onLoginSuccess: (result: LoginResponse) => void;
};

export default function NaverLogin({ onLoginSuccess }: NaverLoginProps) {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "NAVER_LOGIN_SUCCESS") {
        onLoginSuccess(event.data.payload);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onLoginSuccess]);

  useEffect(() => {
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

    function initNaverLogin() {
      const naverLogin = new window.naver.LoginWithNaverId({
        clientId: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!,
        callbackUrl: `${window.location.origin}/auth/naver/callback`,
        isPopup: true,
        callbackHandle: true,
      });
      naverLogin.init();
    }
  }, []);

  const handleNaverLogin = () => {
    const naverLoginButton = document.getElementById(
      "naverIdLogin_loginButton",
    );
    naverLoginButton?.click();
  };

  return (
    <>
      <LoginButton onClick={handleNaverLogin}>Naver 로그인</LoginButton>
      <div
        id="naverIdLogin_loginButton"
        style={{ position: "absolute", top: "-9999px", left: "-9999px" }}
      />
    </>
  );
}
