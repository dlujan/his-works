import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

export type ProfileResult = {
  uuid: string;
  full_name: string;
  avatar_url: string;
  following: {
    followed_uuid: string;
    followed: {
      uuid: string;
      full_name: string;
      avatar_url: string;
    }[];
  }[];
  followers: {
    follower_uuid: string;
    follower: {
      uuid: string;
      full_name: string;
      avatar_url: string;
    }[];
  }[];
};

const fetchData = async (id: string): Promise<ProfileResult> => {
  const { data, error } = await supabase
    .from("user")
    .select(
      `
        uuid,
        full_name,
        avatar_url,
        following:follow!follower_uuid ( 
          followed_uuid, 
          followed:followed_uuid ( uuid, full_name, avatar_url ) 
        ),
        followers:follow!followed_uuid ( 
          follower_uuid, 
          follower:follower_uuid ( uuid, full_name, avatar_url ) 
        )
      `
    )
    .eq("uuid", id)
    .single();

  if (error) {
    console.error("Error fetching profile:", error.message);
    throw new Error(error.message);
  }
  return data;
};

export const useProfile = (id: string) => {
  const query = useQuery<ProfileResult>({
    queryKey: ["profile", id],
    queryFn: () => fetchData(id),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!id,
  });

  return {
    profile: query.data || ({} as ProfileResult),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
};
