import { Mention, SeedMention } from "../models/mention.model";
import { MentionRepository } from "../repositories/mention.repository";
import { deduplicateMentions } from "../utils/duplicate-detector";
import { normalizeMention } from "../utils/mention-normalizer";


export class MentionService {

    static async ingestMentions(
        data: SeedMention[]
    ): Promise<{
        received: number
        unique: number
        inserted: number
    }> {

        if (!Array.isArray(data)) {
            throw new Error(
                "MustBeArray"
            )
        }

        const received = data.length

        // NORMALIZE
        const normalized = data.map((el) => normalizeMention(el))
        // Canonicalize Source
        const canonicalized = this.canonicalizeSources(normalized);
        // handle duplication
        const unique = deduplicateMentions(canonicalized);

        const inserted = await MentionRepository.upsertMany(unique);
        return {
            received,
            unique: unique.length,
            inserted,
        };

    }

    private static canonicalizeSources(
        mentions: Mention[]
    ): Mention[] {

        const canonicalSources = new Map<string, string>();

        return mentions.map((mention) => {
            // CHECT EXIST OR NOT
            const existing = canonicalSources.get(mention.sourceKey);

            if (existing) {
                return {
                    ...mention,
                    source: existing,
                };
            }

            canonicalSources.set(
                mention.sourceKey,
                mention.source
            );

            return mention;
        });
    }

    static async searchMentions(
        filters: {
            q?: string;
            source?: string;
            from?: string;
            to?: string;
            page: number;
            limit: number;
        }
    ) {
        return MentionRepository.search(
            filters
        );
    }
}