import { SeedMention } from "../models/mention.model";
import { normalizeMention } from "../utils/mention-normalizer";


export class MentionService {

    static async ingestMentions(
        data: SeedMention[]
    ): Promise<{
        received: number
    }> {

        if (!Array.isArray(data)) {
            throw new Error(
                "Request body must be an array"
            )
        }

        const received = data.length

        // NORMALIZE
        const normalized = data.map((el)=>normalizeMention(el))

        return {
            received,
            //   unique: unique.length,
            //   inserted,
        };

    }
}