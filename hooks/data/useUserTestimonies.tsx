import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const fetchData = async (userUuid: string) => {
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
      )
    `
    )
    .eq("user_uuid", userUuid)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching testimonies:", error.message);
    throw new Error(error.message);
  }

  // Flatten tags into a clean array of names
  const testimonies = data?.map((t) => ({
    ...t,
    tags: t.testimony_tag?.map((tt: any) => tt.tag.name) ?? [],
  }));

  return testimonies;
};

export const useUserTestimonies = (userUuid: string) => {
  const query = useQuery<Testimony[]>({
    queryKey: ["user-testimonies", userUuid],
    queryFn: () => fetchData(userUuid),
    staleTime: 1000 * 60 * 10, // 10 minutes
    enabled: !!userUuid,
  });

  return {
    testimonies: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
};
