import { supabase } from "@/lib/supabase"; // adjust import to your setup
import { useMutation } from "@tanstack/react-query";
import { Alert } from "react-native";

type ReportPayload = {
    reporter_uuid: string;
    entity_uuid: string;
    reason: string;
};

export function useReportTestimony() {
    return useMutation({
        mutationFn: async (
            { reporter_uuid, entity_uuid, reason }: ReportPayload,
        ) => {
            // Check if report already exists
            const { data: existingReport, error: existingError } =
                await supabase
                    .from("report")
                    .select("*")
                    .eq("reporter_uuid", reporter_uuid)
                    .eq("entity_type", "testimony")
                    .eq("entity_uuid", entity_uuid)
                    .eq("reason", reason)
                    .maybeSingle();

            if (existingError) throw existingError;

            if (existingReport) {
                return { alreadyExists: true };
            }

            // Insert a new report
            const { error: insertError } = await supabase.from("report").insert(
                {
                    reporter_uuid,
                    entity_type: "testimony",
                    entity_uuid,
                    reason,
                },
            );

            if (insertError) throw insertError;

            return { alreadyExists: false };
        },

        onSuccess: (result) => {
            if (result.alreadyExists) {
                Alert.alert(
                    "Report Already Submitted",
                    "You have already issued a report for this testimony. It is currently under review.",
                );
            } else {
                Alert.alert(
                    "Report Submitted",
                    "Thank you for submitting this report. We will review it and take any necessary action.",
                );
            }
        },

        onError: (error: any) => {
            console.error("Error submitting report:", error);
            Alert.alert(
                "Error",
                "An error occurred while submitting your report.",
            );
        },
    });
}
