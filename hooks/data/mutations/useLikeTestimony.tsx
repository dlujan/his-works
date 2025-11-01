import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { HomeFeedResult, HomeFeedTestimony } from "../useHomeFeed";
import {
  ProfileTestimoniesResult,
  UserProfileTestimony,
} from "../useUserTestimonies";

export const useLikeTestimony = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      testimonyUuid,
      viewerUuid,
      liked,
    }: {
      testimonyUuid: string;
      viewerUuid: string; // the person liking (current user)
      liked: boolean;
    }) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      if (liked) {
        const { error } = await supabase
          .from("testimony_like")
          .insert({ testimony_uuid: testimonyUuid, user_uuid: viewerUuid });
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("testimony_like")
          .delete()
          .eq("testimony_uuid", testimonyUuid)
          .eq("user_uuid", viewerUuid);
        if (error) throw new Error(error.message);
      }
    },

    onMutate: async ({ testimonyUuid, liked, viewerUuid }) => {
      const feedKey = ["home-feed", viewerUuid];
      const singleKey = ["testimony", testimonyUuid];
      const profileKeys = queryClient
        .getQueryCache()
        .findAll({ queryKey: ["user-testimonies"] })
        .map((q) => q.queryKey); // handles any user profile open

      // Cancel relevant queries
      await Promise.all([
        queryClient.cancelQueries({ queryKey: feedKey }),
        queryClient.cancelQueries({ queryKey: singleKey }),
        ...profileKeys.map((k) => queryClient.cancelQueries({ queryKey: k })),
      ]);

      // Save previous data
      const prevFeedData = queryClient.getQueryData<any>(feedKey);
      const prevSingleData = queryClient.getQueryData<any>(singleKey);
      const prevProfileData = profileKeys.map((k) => ({
        key: k,
        data: queryClient.getQueryData<any>(k),
      }));

      // ---- Optimistically update the feed (infinite query) ----
      if (prevFeedData) {
        queryClient.setQueryData(feedKey, (oldData: any) => ({
          ...oldData,
          pages: oldData.pages.map((page: HomeFeedResult) => ({
            ...page,
            testimonies: page.testimonies.map((t: HomeFeedTestimony) =>
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

      // Update any User Profile testimonies
      for (const { key, data } of prevProfileData) {
        if (!data) continue;
        queryClient.setQueryData(key, (oldData: any) => ({
          ...oldData,
          pages: oldData.pages.map((page: ProfileTestimoniesResult) => ({
            ...page,
            testimonies: page.testimonies.map((t: UserProfileTestimony) =>
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

      return {
        prevFeedData,
        prevSingleData,
        prevProfileData,
        feedKey,
        singleKey,
        profileKeys,
      };
    },

    onError: (_error, _vars, context) => {
      if (!context) return;
      const {
        prevFeedData,
        prevSingleData,
        prevProfileData,
        feedKey,
        singleKey,
      } = context;
      if (prevFeedData) queryClient.setQueryData(feedKey, prevFeedData);
      if (prevSingleData) queryClient.setQueryData(singleKey, prevSingleData);
      if (prevProfileData)
        for (const { key, data } of prevProfileData)
          queryClient.setQueryData(key, data);
    },

    onSettled: (_data, _error, _vars, context) => {
      if (!context) return;
      const { feedKey, singleKey, profileKeys } = context;
      queryClient.invalidateQueries({ queryKey: feedKey, type: "inactive" });
      queryClient.invalidateQueries({ queryKey: singleKey, type: "inactive" });
      for (const key of profileKeys)
        queryClient.invalidateQueries({ queryKey: key, type: "inactive" });
    },
  });
};
