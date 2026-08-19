import { describe, expect, it } from "vitest";

import {
    getDuplicateKey,
    deduplicateMentions,
} from "../utils/duplicate-detector";
import { randomUUID } from "node:crypto";

describe("Duplicate Detector", () => {
    it("should use normalized URL as duplicate key", () => {
        const mention = {
            id: randomUUID(),
            externalId: "str-99120",
            source: "The Star",
            sourceKey: "thestar",
            title: "Ringgit strengthens",
            content: "Ringgit opened higher",
            url: "https://example.com/article",
            author: "Aisyah",
            publishedAt: new Date("2026-08-10T08:15:00Z"),
            engagement: 412,
        };

        expect(getDuplicateKey(mention))
            .toBe("url:https://example.com/article");
    });

    it("should detect duplicate mentions", () => {
        const mentions = [
            {
                id: randomUUID(),
                externalId: "1",
                source: "The Star",
                sourceKey: "thestar",
                title: "Article",
                content: "Content",
                url: "https://example.com/article",
                author: null,
                publishedAt: new Date(
                    "2026-08-10T08:00:00Z"
                ),
                engagement: 100,
            },
            {
                id: randomUUID(),
                externalId: "2",
                source: "The Star",
                sourceKey: "thestar",
                title: "Article",
                content: "Content",
                url: "https://example.com/article",
                author: null,
                publishedAt: new Date(
                    "2026-08-10T08:00:00Z"
                ),
                engagement: 200,
            },
        ];

        const result = deduplicateMentions(mentions);

        expect(result).toHaveLength(1);
    });

    it("should use fallback key when URL is unavailable", () => {
        const mention = {
            id: randomUUID(),
            externalId: "1",
            source: "The Star",
            sourceKey: "thestar",
            title: "Ringgit strengthens",
            content: "Content",
            url: null,
            author: null,
            publishedAt: new Date(
                "2026-08-10T08:15:00Z"
            ),
            engagement: 100,
        };

        const key = getDuplicateKey(mention);

        expect(key).toBe("fallback|thestar|ringgit strengthens|2026-08-10");
    });
});