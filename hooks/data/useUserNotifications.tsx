import { supabase } from "@/lib/supabase";
import { AppNotification } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 20;

type FetchResult = {
  notifications: AppNotification[];
  nextPage: number;
  hasMore: boolean;
};

const fetchNotifications = async (
  userUuid: string,
  page: number
): Promise<FetchResult> => {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("notification")
    .select("*", { count: "exact" })
    .eq("user_uuid", userUuid)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const hasMore = to + 1 < (count ?? 0);

  return {
    notifications: data ?? [],
    nextPage: page + 1,
    hasMore,
  };
};

export const useUserNotifications = (userUuid: string) => {
  return useInfiniteQuery<FetchResult>({
    queryKey: ["notifications", userUuid],
    queryFn: ({ pageParam }) =>
      fetchNotifications(userUuid, pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 0,
    enabled: !!userUuid,
  });
};
