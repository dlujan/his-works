import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const fetchData = async (id: string) => {
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
    user(avatar_url, full_name)
  `
    )
    .eq("uuid", id)
    .single();

  if (error) {
    console.error("Error fetching testimony:", error.message);
    throw new Error(error.message);
  }

  return {
    ...data,
    tags: data.testimony_tag?.map((tt: any) => tt.tag.name) ?? [],
  };
};

export const useTestimony = (id: string) => {
  const query = useQuery<Testimony>({
    queryKey: ["testimony", id],
    queryFn: () => fetchData(id),
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
