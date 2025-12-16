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
  page: number,
  searchQuery?: string
): Promise<FetchResult> => {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
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
       testimony_image(*),
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

  // 🔍 If search text is provided, filter by text or tag name
  if (searchQuery && searchQuery.trim() !== "") {
    query = query.or(
      `text.ilike.%${searchQuery}%,bible_verse.ilike.%${searchQuery}%`
    );
  }

  const { data, error, count } = await query;

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
      images: t.testimony_image,
      likes_count: likesCount,
    };
  });

  const hasMore = to + 1 < (count ?? 0);

  return { testimonies, nextPage: page + 1, hasMore };
};

export const useMyTestimonies = (userUuid: string, searchQuery?: string) => {
  return useInfiniteQuery<FetchResult>({
    queryKey: ["my-testimonies", userUuid, searchQuery],
    queryFn: ({ pageParam }) =>
      fetchData(userUuid, pageParam as number, searchQuery),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 0, // ✅ required in React Query v5
    enabled: !!userUuid,
  });
};
