import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

const fetchData = async (userUuid: string) => {
  const { data, error } = await supabase
    .from("testimony")
    .select("*")
    .eq("user_uuid", userUuid)
    .order("created_at", { ascending: false });
  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }

  return data;
};

export const useUserTestimonies = (userUuid: string) => {
  const query = useQuery<Testimony[]>({
    queryKey: ["user-testimonies", userUuid],
    queryFn: () => fetchData(userUuid),
    staleTime: 1000 * 60 * 10, // 10 minute
    enabled: !!userUuid, // Prevent query from running if userUuid is undefined/null
  });

  return {
    testimonies: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
};
