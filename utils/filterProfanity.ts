// @ts-ignore
import leoProfanity from "leo-profanity";
import { profaneWords } from "./profane-words";

// Initialize dictionary once
leoProfanity.loadDictionary();
leoProfanity.add(profaneWords);

/**
 * Filters profanity (including punctuated variants like "shit!!??")
 * using leo-profanity + phrase matching.
 *
 * @param text - The text to sanitize
 * @returns The cleaned text
 */
export function filterProfanity(text: string): string {
    if (!text) return text;

    // Normalize text by padding punctuation with spaces
    // e.g. "shit!!??" → "shit !! ??"
    const normalized = text.replace(/([!?.,;:])/g, " $1 ");

    // Run leo-profanity on normalized text
    let cleaned = leoProfanity.clean(normalized);

    // Handle multi-word phrases manually
    const phrases = profaneWords.filter((word) => word.includes(" "));

    for (const phrase of phrases) {
        // Escape regex safely and allow punctuation between words
        const regex = new RegExp(
            phrase
                .trim()
                .split(/\s+/)
                .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
                .join("[\\s!?.,;:]*"), // allow punctuation between words
            "gi",
        );

        cleaned = cleaned.replace(regex, "*".repeat(phrase.length));
    }

    // Remove extra spaces added by normalization
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned;
}
