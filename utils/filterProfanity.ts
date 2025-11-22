import { Profanity } from "@2toad/profanity";
import { profaneWords } from "./profane-words";

const profanity = new Profanity({
    grawlix: "*****",
});
profanity.addWords(profaneWords);
profanity.removeWords(["butt"]);

export function filterProfanity(text: string): string {
    if (!text) return "";
    return profanity.censor(text);
}
