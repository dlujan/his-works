import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 10;

export type UserProfileTestimony = Testimony & {
  likes_count: number;
  liked_by_user: boolean;
  user_full_name: string;
  user_avatar_url: string;
};
type FetchResult = {
  testimonies: UserProfileTestimony[];
  nextPage: number;
  hasMore: boolean;
};
const fetchData = async (
  targetUserUuid: string,
  appUserUuid: string | undefined,
  page: number
): Promise<FetchResult> => {
  const { data, error } = await supabase.rpc("get_user_testimonies", {
    input_viewer_uuid: appUserUuid,
    input_target_uuid: targetUserUuid,
    input_page: page,
    input_page_size: 10,
  });

  if (error) throw new Error(error.message);

  return {
    testimonies: data ?? [],
    nextPage: page + 1,
    hasMore: (data?.length ?? 0) === PAGE_SIZE,
  };
};

export const useUserTestimonies = (userUuid: string) => {
  const { user } = useAuth();
  return useInfiniteQuery<FetchResult>({
    queryKey: ["user-testimonies", userUuid],
    queryFn: ({ pageParam }) =>
      fetchData(userUuid, user?.uuid, pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 0,
    enabled: !!userUuid,
  });
};
