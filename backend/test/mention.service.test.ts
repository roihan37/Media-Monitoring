import app from "../app";
import request from "supertest";
import {
    describe,
    expect,
    it,
    vi,
} from "vitest";

import { MentionService } from "../services/mention.service";
import { MentionRepository } from "../repositories/mention.repository";


/**
 * Mock repository so these tests focus
 * on service/controller behavior without
 * requiring a real database.
 */
vi.mock(
    "../repositories/mention.repository",
    () => ({
        MentionRepository: {
            upsertMany: vi.fn(),
            search: vi.fn(),
            getStats: vi.fn(),
        },
    })
);


describe("MentionService", () => {

    it("should normalize and ingest mentions", async () => {

        vi.mocked(
            MentionRepository.upsertMany
        ).mockResolvedValue(1);

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

        const result =
            await MentionService.ingestMentions(
                data
            );

        expect(
            MentionRepository.upsertMany
        ).toHaveBeenCalled();

        expect(result).toEqual({
            received: 1,
            unique: 1,
            inserted: 1,
        });
    });


    it("should not send duplicate mentions to repository", async () => {

        vi.mocked(
            MentionRepository.upsertMany
        ).mockResolvedValue(1);

        const data = [
            {
                external_id: "1",
                source: "The Star",
                title: "Same Article",
                content: "Content",
                url: "https://example.com/article",
                author: null,
                published_at:
                    "2026-08-10T08:00:00Z",
                engagement: 100,
            },
            {
                external_id: "2",
                source: "The Star",
                title: "Same Article",
                content: "Content",
                url: "https://example.com/article",
                author: null,
                published_at:
                    "2026-08-10T08:00:00Z",
                engagement: 200,
            },
        ];

        await MentionService.ingestMentions(
            data
        );

        const call =
            vi.mocked(
                MentionRepository.upsertMany
            ).mock.calls[0][0];

        expect(call).toHaveLength(1);
    });

});


describe("GET /mentions", () => {

    it("should filter by source", async () => {

        vi.mocked(
            MentionRepository.search
        ).mockResolvedValue({
            data: [
                {
                    source: "The Star",
                    source_key: "thestar",
                    title: "Ringgit strengthens",
                },
            ],
            pagination: {
                page: 1,
                limit: 20,
                total: 1,
                totalPages: 1,
            },
        });

        const response =
            await request(app)
                .get("/mentions")
                .query({
                    source: "The Star",
                });

        expect(response.status).toBe(200);

        expect(
            response.body.data.every(
                (mention: any) =>
                    mention.source === "The Star"
            )
        ).toBe(true);
    });

});

it("should return source statistics", async () => {

    vi.mocked(
        MentionRepository.getStats
    ).mockResolvedValue([
        {
            source: "The Star",
            count: 3,
        },
        {
            source: "Twitter",
            count: 2,
        },
    ]);

    const response =
        await request(app)
            .get("/mentions/stats")
            .query({
                group_by: "source",
            });

    expect(response.status).toBe(200);

    expect(
        response.body
    ).toBeInstanceOf(Array);
});