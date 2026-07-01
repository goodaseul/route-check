interface NaverLoginUser {
  getId: () => string;
  getEmail: () => string;
  getName: () => string;
  getNickName: () => string;
  getProfileImage: () => string;
}

interface NaverLoginOptions {
  clientId: string;
  callbackUrl: string;
  isPopup: boolean;
  callbackHandle?: boolean;
}

interface NaverLoginInstance {
  init: () => void;
  getLoginStatus: (callback: (status: boolean) => void) => void;
  user: NaverLoginUser;
}

interface NaverIdLoginStatic {
  LoginWithNaverId: new (options: NaverLoginOptions) => NaverLoginInstance;
}

declare global {
  interface Window {
    naver: NaverIdLoginStatic;
  }
}

export { NaverLoginInstance };
