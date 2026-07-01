export interface LoginRequest {
  auth_provider: string;
  provider_user_id: string;
  email: string;
  name: string;
  nickname: string;
  profile_image: string;
}

export interface LoginResponse {
  id: number;
  email: string;
  name: string;
  nickname: string;
  profile_image: string;
  auth_provider: string;
  provider_user_id: string;
  is_active: true;
  created_at: string;
  updated_at: string;
  deleted_at: string;
}
