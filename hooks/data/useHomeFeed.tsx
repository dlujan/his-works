import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 10;

export type HomeFeedResult = {
  testimonies: Testimony[];
  nextPage: number;
  hasMore: boolean;
};

const fetchFeed = async (
  userUuid: string,
  page: number
): Promise<HomeFeedResult> => {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("testimony")
    .select("*, user(full_name, avatar_url),testimony_like(user_uuid)", {
      count: "exact",
    })
    .or(`user_uuid.eq.${userUuid},is_public.eq.true,is_private.eq.false`)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const testimonies =
    data?.map((t) => {
      const likes = t.testimony_like || [];
      const likesCount = likes.length;
      const likedByUser = likes.some((l: any) => l.user_uuid === userUuid);

      return {
        ...t,
        likes_count: likesCount,
        liked_by_user: likedByUser,
      };
    }) ?? [];
  const hasMore = to + 1 < (count ?? 0);

  return { testimonies, nextPage: page + 1, hasMore };
};

export const useHomeFeed = (userUuid: string) => {
  return useInfiniteQuery<HomeFeedResult>({
    queryKey: ["home-feed", userUuid],
    queryFn: ({ pageParam }) => fetchFeed(userUuid, pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 0, // ✅ required in React Query v5
    enabled: !!userUuid,
  });
};
