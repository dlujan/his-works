import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

type FetchResult = Testimony & {
  followed_by_user: boolean;
  likes_count: number;
  liked_by_user: boolean;
  comments_count: number;
};
const fetchData = async (id: string, appUserId?: string) => {
  const { data, error } = await supabase
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
      scheduled_for,
      type
    ),
    user(avatar_url, full_name),
    testimony_like(user_uuid),
    comment(uuid)
  `
    )
    .eq("uuid", id)
    .single();

  if (error) {
    console.error("Error fetching testimony:", error.message);
    throw new Error(error.message);
  }

  const comments = data.comment || [];
  const commentsCount = comments.length;
  const likes = data.testimony_like || [];
  const likesCount = likes.length;
  const likedByUser =
    appUserId && likes.some((l: any) => l.user_uuid === appUserId);

  let followedByUser = false;
  if (appUserId && data.user_uuid && appUserId !== data.user_uuid) {
    const { data: followRows, error: followError } = await supabase
      .from("follow")
      .select("follower_uuid")
      .eq("follower_uuid", appUserId)
      .eq("followed_uuid", data.user_uuid)
      .limit(1)
      .maybeSingle();
    if (followError) {
      console.error("Error checking follow:", followError.message);
    } else {
      followedByUser = !!followRows;
    }
  }

  return {
    ...data,
    tags: data.testimony_tag?.map((tt: any) => tt.tag.name) ?? [],
    reminders: data.reminder?.map((rem: any) => rem),
    likes_count: likesCount,
    liked_by_user: likedByUser,
    comments_count: commentsCount,
    followed_by_user: followedByUser,
  };
};

export const useTestimony = (id: string) => {
  const { user } = useAuth();
  const query = useQuery<FetchResult>({
    queryKey: ["testimony", id],
    queryFn: () => fetchData(id, user?.uuid),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!id,
  });

  return {
    testimony: query.data || ({} as FetchResult),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
};
