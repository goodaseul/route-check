import { useGoogleLogin } from "@react-oauth/google";
import fetchLoginGoogle from "@/api/loginGoogle";
import LoginButton from "@/components/common/buttons/LoginButton";
type GoogleUserInfo = {
  sub: string;
  email: string;
  name: string;
  picture: string;
};

export default function GoogleLogin() {
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // 1. access_token으로 구글에 유저 정보 요청
        const res = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          },
        );
        const userInfo: GoogleUserInfo = await res.json();

        // 2. 우리 백엔드로 로그인 요청
        const result = await fetchLoginGoogle({
          auth_provider: "google",
          provider_user_id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name,
          nickname: userInfo.name,
          profile_image: userInfo.picture,
        });

        return result;
        // console.log("로그인 성공:", result);
      } catch (error) {
        console.error("로그인 처리 중 오류:", error);
      }
    },
    onError: () => {
      alert("구글 로그인에 실패했습니다.");
    },
  });
  return <LoginButton onClick={() => googleLogin()}>Google 로그인</LoginButton>;
}
