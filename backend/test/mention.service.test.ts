import {describe, expect, it, vi} from "vitest";

import { MentionService } from "../services/mention.service";
import { MentionRepository } from "../repositories/mention.repository";

vi.mock("../repositories/mention.repository",() => ({
        MentionRepository: {upsertMany: vi.fn(),},
    })
);

describe("MentionService", () => {
    it("should normalize and ingest mentions", async () => {
        vi.mocked(MentionRepository.upsertMany)
        .mockResolvedValue(1);

        const data = [
            {
                external_id: "str-99120",
                source: " THE STAR ",
                title: "Ringgit strengthens",
                content: "<p>Hello</p>",
                url: "https://example.com/article",
                author: "Aisyah",
                published_at:
                    "2026-08-10T08:15:00Z",
                engagement: "1,204",
            },
        ];

        const result =await MentionService.ingestMentions(data);

        expect(MentionRepository.upsertMany).toHaveBeenCalled();

        expect(result).toEqual({inserted: 1,updated: 0,});
    });
});