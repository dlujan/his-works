import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Comment } from "@/lib/types";
import { useInfiniteQuery } from "@tanstack/react-query";

const PAGE_SIZE = 10;

export type TestimonyComment = Comment & {
  likes_count: number;
  liked_by_user: boolean;
};
export type TestimonyCommentsResult = {
  comments: TestimonyComment[];
  nextPage: number;
  hasMore: boolean;
  totalCount: number;
};
const fetchData = async (
  testimonyUuid: string,
  page: number,
  appUserId?: string
): Promise<TestimonyCommentsResult> => {
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error, count } = await supabase
    .from("comment")
    .select("*, user(avatar_url,full_name), comment_like(*)", {
      count: "exact",
    })
    .eq("testimony_uuid", testimonyUuid)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw new Error(error.message);

  const hasMore = to + 1 < (count ?? 0);

  const comments: TestimonyComment[] = data.map((comment) => {
    const likesCount = comment.comment_like.length;
    const likedByUser =
      appUserId &&
      comment.comment_like.some((l: any) => l.user_uuid === appUserId);
    return {
      ...comment,
      likes_count: likesCount,
      liked_by_user: likedByUser,
    };
  });

  return {
    comments: comments ?? [],
    nextPage: page + 1,
    hasMore,
    totalCount: count ?? 0,
  };
};

export const useTestimonyComments = (testimonyUuid: string) => {
  const { user } = useAuth();
  return useInfiniteQuery<TestimonyCommentsResult>({
    queryKey: ["testimony-comments", testimonyUuid],
    queryFn: ({ pageParam }) =>
      fetchData(testimonyUuid, pageParam as number, user!.uuid),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextPage : undefined,
    initialPageParam: 0,
    enabled: !!testimonyUuid,
  });
};
