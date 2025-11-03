import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 20;

type FetchResult = {
  followers: Partial<User>[];
  nextPage: number;
  hasMore: boolean;
  totalCount: number;
};

const fetchData = async (
  userUuid: string,
  page: number
): Promise<FetchResult> => {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("follow")
    .select(
      `
          *,
          follower:user!follow_follower_uuid_fkey ( uuid, full_name, avatar_url )
        `,
      { count: "exact" }
    )
    .eq("followed_uuid", userUuid)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const hasMore = to + 1 < (count ?? 0);

  return {
    followers: data.map((follow) => follow.follower) ?? [],
    nextPage: page + 1,
    hasMore,
    totalCount: count ?? 0,
  };
};

export const useUserFollowers = (userUuid: string) => {
  return useInfiniteQuery<FetchResult>({
    queryKey: ["user-followers", userUuid],
    queryFn: ({ pageParam }) => fetchData(userUuid, pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 0,
    enabled: !!userUuid,
  });
};
