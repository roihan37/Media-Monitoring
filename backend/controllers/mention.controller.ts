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

        } catch (error) {

        }
    }
} 