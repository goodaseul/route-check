const NAVER_SDK_ID = "naver-login-sdk";
const NAVER_SDK_URL =
  "https://static.nid.naver.com/js/naveridlogin_js_sdk_2.0.2.js";

let sdkPromise: Promise<void> | null = null;

export function loadNaverSdk(): Promise<void> {
  if (window.naver?.LoginWithNaverId) {
    return Promise.resolve();
  }

  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = new Promise((resolve, reject) => {
    const handleLoad = () => {
      if (window.naver?.LoginWithNaverId) {
        resolve();
        return;
      }

      sdkPromise = null;
      reject(new Error("네이버 로그인 SDK를 초기화하지 못했습니다."));
    };

    const handleError = () => {
      sdkPromise = null;
      reject(new Error("네이버 로그인 SDK를 불러오지 못했습니다."));
    };

    const existingScript = document.getElementById(
      NAVER_SDK_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = NAVER_SDK_ID;
    script.src = NAVER_SDK_URL;
    script.async = true;
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    document.head.appendChild(script);
  });

  return sdkPromise;
}
