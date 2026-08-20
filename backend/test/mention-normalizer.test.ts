import { describe, expect, it } from "vitest";
import { normalizeContent, normalizeEngagement, normalizeSource } from "../utils/mention-normalizer";



describe("Mention Normalizer", ()=>{

    describe("normalizeSource", ()=>{
        it("should normalize source names consistently", ()=>{
            expect(normalizeSource("The Star"))
                .toEqual({name : "The Star", key: "thestar"});

            expect(normalizeSource("the-star"))
                .toEqual({name : "The Star", key: "thestar"});

            expect(normalizeSource("THE STAR"))
                .toEqual({name : "The Star", key: "thestar"});

            expect(normalizeSource(" thestar "))
                .toEqual({ name: 'Thestar', key: 'thestar' });
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