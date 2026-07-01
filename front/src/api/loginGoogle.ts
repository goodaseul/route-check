import fetcher from "./fetcher";
import { LoginRequest, LoginResponse } from "./types/auth";

export default function fetchLoginGoogle(
  payload: LoginRequest,
): Promise<LoginResponse> {
  return fetcher("/api/auth/login/google", {
    method: "POST",
    body: payload,
  });
}
