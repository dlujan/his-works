import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

type DeleteCommentInput = {
    comment_uuid: string;
    viewer_uuid: string;
    testimony_uuid: string;
};

export const useDeleteComment = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (
            { comment_uuid, viewer_uuid }: DeleteCommentInput,
        ) => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            const { error } = await supabase
                .from("comment")
                .delete()
                .eq("uuid", comment_uuid)
                .eq("user_uuid", viewer_uuid);

            if (error) throw new Error(error.message);
        },

        onMutate: async ({ comment_uuid, testimony_uuid }) => {
            const queryKey = ["testimony-comments", testimony_uuid];

            // Cancel any in-flight fetches
            await queryClient.cancelQueries({ queryKey });

            // Snapshot previous data
            const prevData = queryClient.getQueryData<any>(queryKey);

            // ---- Optimistically remove the comment ----
            if (prevData) {
                queryClient.setQueryData(queryKey, (oldData: any) => ({
                    ...oldData,
                    pages: oldData.pages.map((page: any) => ({
                        ...page,
                        comments: page.comments.filter(
                            (comment: any) => comment.uuid !== comment_uuid,
                        ),
                    })),
                }));
            }

            return { prevData, queryKey };
        },

        onError: (_error, _vars, context) => {
            // Roll back on failure
            if (context?.prevData) {
                queryClient.setQueryData(context.queryKey, context.prevData);
            }
        },

        onSettled: (_data, _error, vars, context) => {
            // Refresh the latest state in the background
            if (context?.queryKey) {
                queryClient.invalidateQueries({
                    queryKey: context.queryKey,
                    type: "inactive",
                });
            }
        },
    });
};
