import { supabase } from "@/lib/supabase";
import { Testimony } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { HomeFeedResult } from "../useHomeFeed";

export const useLikeTestimony = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testimonyUuid,
      userUuid,
      liked,
    }: {
      testimonyUuid: string;
      userUuid: string;
      liked: boolean;
    }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      if (liked) {
        const { error } = await supabase
          .from("testimony_like")
          .insert({ testimony_uuid: testimonyUuid, user_uuid: userUuid });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("testimony_like")
          .delete()
          .eq("testimony_uuid", testimonyUuid)
          .eq("user_uuid", userUuid);
        if (error) throw new Error(error.message);
      }
    },

    onMutate: async ({ testimonyUuid, liked, userUuid }) => {
      const feedKey = ["home-feed", userUuid];
      const singleKey = ["testimony", testimonyUuid];

      await Promise.all([
        queryClient.cancelQueries({ queryKey: feedKey }),
        queryClient.cancelQueries({ queryKey: singleKey }),
      ]);

      const prevFeedData = queryClient.getQueryData<any>(feedKey);
      const prevSingleData = queryClient.getQueryData<any>(singleKey);

      // ---- Optimistically update the feed (infinite query) ----
      if (prevFeedData) {
        queryClient.setQueryData(feedKey, (oldData: any) => ({
          ...oldData,
          pages: oldData.pages.map((page: HomeFeedResult) => ({
            ...page,
            testimonies: page.testimonies.map((t: Testimony) =>
              t.uuid === testimonyUuid
                ? {
                    ...t,
                    likes_count: Math.max(
                      0,
                      (t.likes_count ?? 0) + (liked ? 1 : -1)
                    ),
                    liked_by_user: liked,
                  }
                : t
            ),
          })),
        }));
      }

      // ---- Optimistically update the single testimony ----
      if (prevSingleData) {
        queryClient.setQueryData(singleKey, (oldData: any) => ({
          ...oldData,
          likes_count: Math.max(
            0,
            (oldData.likes_count ?? 0) + (liked ? 1 : -1)
          ),
          liked_by_user: liked,
        }));
      }

      return { prevFeedData, prevSingleData, feedKey, singleKey };
    },

    onError: (_error, _vars, context) => {
      // rollback on failure
      if (!context) return;
      const { prevFeedData, prevSingleData, feedKey, singleKey } = context;
      if (prevFeedData) queryClient.setQueryData(feedKey, prevFeedData);
      if (prevSingleData) queryClient.setQueryData(singleKey, prevSingleData);
    },

    onSettled: (_data, _error, _vars, context) => {
      if (!context) return;
      const { feedKey, singleKey } = context;

      // background refresh to stay consistent without causing flicker
      queryClient.refetchQueries({
        queryKey: feedKey,
        type: "inactive",
      });
      queryClient.refetchQueries({
        queryKey: singleKey,
        type: "inactive",
      });
    },
  });
};
