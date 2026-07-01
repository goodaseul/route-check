import fetcher from "./fetcher";
import { GoogleLoginRequest, GoogleLoginResponse } from "./types/auth";

export default function fetchLoginGoogle(
  payload: GoogleLoginRequest,
): Promise<GoogleLoginResponse> {
  return fetcher("/api/auth/login/google", {
    method: "POST",
    body: payload,
  });
}
