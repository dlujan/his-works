import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

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
    user(avatar_url, full_name),
    testimony_like(*)
  `
    )
    .eq("uuid", id)
    .single();

  if (error) {
    console.error("Error fetching testimony:", error.message);
    throw new Error(error.message);
  }

  const likes = data.testimony_like || [];
  const likesCount = likes.length;
  const likedByUser =
    appUserId && likes.some((l: any) => l.user_uuid === appUserId);

  return {
    ...data,
    tags: data.testimony_tag?.map((tt: any) => tt.tag.name) ?? [],
    likes_count: likesCount,
    liked_by_user: likedByUser,
  };
};

export const useTestimony = (id: string) => {
  const { user } = useAuth();
  const query = useQuery<Testimony>({
    queryKey: ["testimony", id],
    queryFn: () => fetchData(id, user?.uuid),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!id,
  });

  return {
    testimony: query.data || ({} as Testimony),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
};
