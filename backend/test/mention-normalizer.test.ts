import { describe, expect, it } from "vitest";
import { normalizeContent, normalizeEngagement, normalizeSource } from "../utils/mention-normalizer";



describe("Mention Normalizer", ()=>{

    describe("normalizeSource", ()=>{
        it("should normalize source names consistently", ()=>{
            expect(normalizeSource("The Star"))
                .toBe("The Star");

            expect(normalizeSource("the-star"))
                .toBe("The Star");

            expect(normalizeSource("THE STAR"))
                .toBe("The Star");

            expect(normalizeSource(" thestar "))
                .toBe("The Star");
        })
    })

    describe("normalizeEngagement", () => {
        it("should convert formatted string to number", () => {
            expect(normalizeEngagement("1,204"))
                .toBe(1204);
        });

        it("should keep numeric engagement", () => {
            expect(normalizeEngagement(412))
                .toBe(412);
        });
    });

    describe("normalizeContent", () => {
        it("should remove HTML tags", () => {
            expect(normalizeContent("<p>Hello <strong>world</strong></p>"))
                .toBe("Hello world");
        });

        it("should remove script tags", () => {
            expect(normalizeContent("<p>Hello</p><script>alert(1)</script>"))
                .toBe("Hello");
        });
    })
})