import fetcher from "@/lib/api/fetcher";
import { LoginRequest, LoginResponse } from "./types/auth";

export default function fetchLoginNaver(
  payload: LoginRequest,
): Promise<LoginResponse> {
  return fetcher("/api/auth/login/naver", {
    method: "POST",
    body: payload,
  });
}
