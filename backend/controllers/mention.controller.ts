import { Request, Response } from "express";
import { MentionService } from "../services/mention.service";

export class MentionController {

    static async seedAllMentions(req: Request, res: Response): Promise<void> {
        try {
            // Implement the logic to seed all mentions here
            const result = await MentionService.ingestMentions(req.body)

            // res.status(200).json({ message: "Mentions seeded successfully." });
        } catch (error) {
            console.error("Error seeding mentions:", error);
            res.status(500).json({ message: "Internal server error." });
        }
    }
} 