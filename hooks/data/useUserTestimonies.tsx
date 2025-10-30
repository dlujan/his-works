import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 10;

type FetchResult = {
  testimonies: Testimony[];
  nextPage: number;
  hasMore: boolean;
};
const fetchData = async (
  userUuid: string,
  page: number
): Promise<FetchResult> => {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("testimony")
    .select(
      `
    *,
    testimony_tag (
      tag:tag_uuid (
        uuid,
        name
      )
    ),
    reminder (
      uuid,
      scheduled_for
    ),
    testimony_like(*)
  `,
      { count: "exact" }
    )
    .eq("user_uuid", userUuid)
    .order("date", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("Error fetching testimonies:", error.message);
    throw new Error(error.message);
  }

  // Flatten tags into a clean array of names
  const testimonies = data?.map((t) => {
    const likes = t.testimony_like || [];
    const likesCount = likes.length;
    return {
      ...t,
      tags: t.testimony_tag?.map((tt: any) => tt.tag.name) ?? [],
      reminders: t.reminder?.map((rem: any) => rem),
      likes_count: likesCount,
    };
  });

  const hasMore = to + 1 < (count ?? 0);

  return { testimonies, nextPage: page + 1, hasMore };
};

export const useUserTestimonies = (userUuid: string) => {
  return useInfiniteQuery<FetchResult>({
    queryKey: ["user-testimonies", userUuid],
    queryFn: ({ pageParam }) => fetchData(userUuid, pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 0, // ✅ required in React Query v5
    enabled: !!userUuid,
  });
};
