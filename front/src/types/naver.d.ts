type NaverLoginUser = {
  getId: () => string;
  getEmail: () => string;
  getName: () => string;
  getNickName: () => string;
  getProfileImage: () => string;
};

type NaverLoginOptions = {
  clientId: string;
  callbackUrl: string;
  isPopup: boolean;
  callbackHandle?: boolean;
};

type NaverLoginInstance = {
  init: () => void;
  getLoginStatus: (callback: (status: boolean) => void) => void;
  user: NaverLoginUser;
};

type NaverIdLoginStatic = {
  LoginWithNaverId: new (options: NaverLoginOptions) => NaverLoginInstance;
};

declare global {
  interface Window {
    naver?: NaverIdLoginStatic;
  }
}

export { NaverLoginInstance };
