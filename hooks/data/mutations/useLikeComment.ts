import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

export const useLikeComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            commentUuid,
            testimonyUuid,
            viewerUuid,
            liked,
        }: {
            commentUuid: string;
            testimonyUuid: string;
            viewerUuid: string; // current user
            liked: boolean;
        }) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

            if (liked) {
                const { error } = await supabase
                    .from("comment_like")
                    .insert({
                        comment_uuid: commentUuid,
                        user_uuid: viewerUuid,
                    });
                if (error) throw new Error(error.message);
            } else {
                const { error } = await supabase
                    .from("comment_like")
                    .delete()
                    .eq("comment_uuid", commentUuid)
                    .eq("user_uuid", viewerUuid);
                if (error) throw new Error(error.message);
            }
        },

        onMutate: async ({ commentUuid, testimonyUuid, liked }) => {
            const queryKey = ["testimony-comments", testimonyUuid];

            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey });

            // Snapshot previous comments data
            const prevData = queryClient.getQueryData<any>(queryKey);

            // ---- Optimistically update ----
            if (prevData) {
                queryClient.setQueryData(queryKey, (oldData: any) => ({
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        comments: page.comments.map((c: any) =>
                            c.uuid === commentUuid
                                ? {
                                    ...c,
                                    likes_count: Math.max(
                                        0,
                                        (c.likes_count ?? 0) + (liked ? 1 : -1),
                                    ),
                                    liked_by_user: liked,
                                }
                                : c
                        ),
                    })),
                }));
            }

            return { prevData, queryKey };
        },

        onError: (_error, _vars, context) => {
            if (context?.prevData) {
                queryClient.setQueryData(context.queryKey, context.prevData);
            }
        },

        onSettled: (_data, _error, vars, context) => {
            if (!context) return;
            queryClient.invalidateQueries({
                queryKey: context.queryKey,
                type: "inactive",
            });
        },
    });
};
