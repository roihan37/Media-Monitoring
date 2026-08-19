import { Mention } from "../models/mention.model";
import pool from "../config/connection";
import { getDuplicateKey } from "../utils/duplicate-detector";

export class MentionRepository {
    static async upsertMany(
        mentions: Mention[]
    ) {
        if (mentions.length === 0) {
            return 0
        }
        const client = await pool.connect();
        let inserted = 0;

        try {
            await client.query("BEGIN");

            for (const mention of mentions) {
                const dedupeKey = getDuplicateKey(mention);

                const result = await client.query(
                        `
            INSERT INTO mentions (
              id,
              external_id,
              source,
              source_key,
              title,
              content,
              url,
              author,
              published_at,
              engagement,
              dedupe_key
            )
            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6,
              $7,
              $8,
              $9,
              $10,
              $11
            )
            ON CONFLICT (dedupe_key)
            DO UPDATE SET
              engagement = GREATEST(
                mentions.engagement,
                EXCLUDED.engagement
              ),
              title = COALESCE(
                mentions.title,
                EXCLUDED.title
              ),
              content = COALESCE(
                mentions.content,
                EXCLUDED.content
              ),
              author = COALESCE(
                mentions.author,
                EXCLUDED.author
              ),
              updated_at = NOW()
            RETURNING (xmax = 0) AS inserted
            `,
                        [
                            mention.id,
                            mention.externalId,
                            mention.source,
                            mention.sourceKey,
                            mention.title,
                            mention.content,
                            mention.url,
                            mention.author,
                            mention.publishedAt,
                            mention.engagement,
                            dedupeKey,
                        ]
                    );

                if (
                    result.rows[0]?.inserted === true
                ) {
                    inserted++;
                }
            }

            await client.query("COMMIT");
            return inserted;
        } catch (error) {
            await client.query("ROLLBACK");
            throw error;
        } finally {
            client.release();
        }
    }
}