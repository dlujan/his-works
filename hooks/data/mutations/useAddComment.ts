import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

type AddCommentInput = {
    user_uuid: string;
    testimony_uuid: string;
    text: string;
};

export const useAddComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            { user_uuid, testimony_uuid, text }: AddCommentInput,
        ) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const { data, error } = await supabase
                .from("comment")
                .insert({
                    user_uuid,
                    testimony_uuid,
                    text,
                })
                .select(
                    `
          uuid,
          text,
          created_at,
          user:user_uuid (
            uuid,
            full_name,
            avatar_url
          )
        `,
                )
                .single();

            if (error) throw new Error(error.message);
            return data;
        },

        onMutate: async (newComment) => {
            const { testimony_uuid, user_uuid, text } = newComment;
            const queryKey = ["testimony-comments", testimony_uuid];

            // Cancel outgoing fetches
            await queryClient.cancelQueries({ queryKey });

            // Snapshot previous data
            const prevData = queryClient.getQueryData<any>(queryKey);

            // Optimistically update cache
            const optimisticComment = {
                uuid: `optimistic-${Date.now()}`,
                text,
                created_at: new Date().toISOString(),
                user: {
                    uuid: user_uuid,
                    full_name: "You",
                    avatar_url: null,
                },
            };

            queryClient.setQueryData(queryKey, (oldData: any) => {
                if (!oldData) {
                    return { pages: [{ comments: [optimisticComment] }] };
                }

                return {
                    ...oldData,
                    pages: oldData.pages.map((page: any, i: number) =>
                        i === 0
                            ? {
                                ...page,
                                comments: [optimisticComment, ...page.comments],
                            }
                            : page
                    ),
                };
            });

            return { prevData, queryKey };
        },

        onError: (err, _vars, context) => {
            if (context?.prevData) {
                queryClient.setQueryData(context.queryKey, context.prevData);
            }
            console.error("Error adding comment:", err);
        },

        onSettled: (_data, _err, vars) => {
            queryClient.invalidateQueries({
                queryKey: ["testimony-comments", vars.testimony_uuid],
            });
        },
    });
};
