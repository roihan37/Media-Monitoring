import { Request, Response } from "express";
import { MentionService } from "../services/mention.service";

export class MentionController {

    static async seedAllMentions(req: Request, res: Response): Promise<void> {
        try {
            // Implement the logic to seed all mentions here
            const result = await MentionService.ingestMentions(req.body)

            res.status(201).json({ message: "Mentions ingested successfully", ...result, });
        } catch (error) {
            console.error("Bulk ingestion error:", error);

            if (error instanceof Error && error.message === "MustBeArray") {
                res.status(400).json({ message: "Request body must be an array", });
                return;
            }

            res.status(500).json({ message: "Failed to ingest mentions", });
        }
    }

    static async searchMentions(req: Request, res: Response): Promise<void> {
        try {
            const page = Number(req.query.page ?? 1)
            const limit = Number(req.query.limit ?? 20)

            // bukan bilangan bulat
            if (!Number.isInteger(page) || page < 1) {
                res.status(400).json({ message: "page must be a positive integer", });
                return;
            }

            if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
                res.status(400).json({
                    message: "limit must be between 1 and 100",
                });
                return;
            }

            const result = await MentionService.searchMentions(
                {
                    q: typeof req.query.q === "string"
                        ? req.query.q
                        : undefined,

                    source: typeof req.query.source === "string"
                        ? req.query.source
                        : undefined,

                    from: typeof req.query.from === "string"
                        ? req.query.from
                        : undefined,

                    to: typeof req.query.to === "string"
                        ? req.query.to
                        : undefined,

                    page,
                    limit,
                }
            );

            res.status(200).json(result);
        } catch (error) {

        }
    }
} 