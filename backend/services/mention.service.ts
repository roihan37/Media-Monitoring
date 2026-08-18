import { SeedMention } from "../models/mention.model";


export class MentionService {

    static async ingestMentions(
        mention : SeedMention[]
    ) : Promise<void> {
        try {

        }catch (error) {
            console.error("Error ingesting mentions:", error);
        }
    }
}