import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

const fetchData = async () => {
  const { data: tags, error } = await supabase.from("tag").select("*");

  if (error) {
    console.error("Error fetching tags:", error.message);
    throw new Error(error.message);
  }

  return tags
    .map((tag) => tag.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
};

export const useTags = () => {
  const query = useQuery<string[]>({
    queryKey: ["tags"],
    queryFn: () => fetchData(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  return {
    tags: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
};
