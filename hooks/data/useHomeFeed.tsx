import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 10;

export type HomeFeedTestimony = Testimony & {
  likes_count: number;
  liked_by_user: boolean;
  user_full_name: string;
  user_avatar_url: string;
  recommended: boolean;
};
export type HomeFeedResult = {
  testimonies: HomeFeedTestimony[];
  nextPage: number;
  hasMore: boolean;
};

const fetchFeed = async (
  userUuid: string,
  page: number
): Promise<HomeFeedResult> => {
  const { data, error } = await supabase.rpc("get_home_feed", {
    input_user_uuid: userUuid,
    input_page: page,
    input_page_size: PAGE_SIZE,
  });

  if (error) throw new Error(error.message);

  return {
    testimonies: data ?? [],
    nextPage: page + 1,
    hasMore: (data?.length ?? 0) === PAGE_SIZE,
  };
};

export const useHomeFeed = (userUuid: string) => {
  return useInfiniteQuery<HomeFeedResult>({
    queryKey: ["home-feed", userUuid],
    queryFn: ({ pageParam }) => fetchFeed(userUuid, pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 0,
    enabled: !!userUuid,
  });
};
