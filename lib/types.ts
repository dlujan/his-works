export type User = {
  uuid: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  avatar_url?: string;
};
export type Testimony = {
  uuid: string;
  created_at: string;
  updated_at: string;
  text: string;
  is_public: boolean;
  image_url?: string;
  user_uuid: string;
  user: User;
};
