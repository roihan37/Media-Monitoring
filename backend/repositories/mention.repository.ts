import { Mention, MentionSearchFilters } from "../models/mention.model";
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


    static async search(
        filters: MentionSearchFilters
    ) {
        const {
            q,
            source,
            from,
            to,
            page,
            limit,
        } = filters;

        const offset = (page - 1) * limit

        const conditions: string[] = [];
        const values: unknown[] = [];

        let parameterIndex = 1;

        if (q) {
            // ILIKE gives case-insensitive matching.
            conditions.push(
            `( title ILIKE $${parameterIndex}
            OR content ILIKE $${parameterIndex} )`
            );

            values.push(`%${q}%`);
            parameterIndex++;
        }

        if (source) {
            // Source filtering uses source_key
            const sourceKey = source
                .trim()
                .toLowerCase()
                .replace(/[\s_-]+/g, "");

            conditions.push(
                `source_key = $${parameterIndex}`
            );

            values.push(sourceKey);
            parameterIndex++;
        }

        if (from) {
            conditions.push(
                `published_at >= $${parameterIndex}`
            );

            values.push(from);
            parameterIndex++;
        }

        if (to) {
            conditions.push(
                `published_at < ($${parameterIndex}::date + INTERVAL '1 day')`
            );

            values.push(to);
            parameterIndex++;
        }

        const whereClause = conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";

        const dataQuery = `
            SELECT
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
                created_at,
                updated_at
            FROM mentions
            ${whereClause}
            ORDER BY
                published_at DESC NULLS LAST,
                id DESC
            LIMIT $${parameterIndex}
            OFFSET $${parameterIndex + 1}
            `;

        const dataValues = [...values, limit, offset,]

        const countQuery = `
            SELECT COUNT(*)::integer AS total
            FROM mentions
            ${whereClause}
        `;

        const [dataResult, countResult] = await Promise.all([
            pool.query(
                dataQuery,
                dataValues
            ),

            pool.query(
                countQuery,
                values
            ),
        ]);

        const total = countResult.rows[0].total;

        return {
            data: dataResult.rows,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };

    }
}