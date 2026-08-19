import { Mention } from "../models/mention.model";

export function deduplicateMentions(
    mentions : Mention[]
) {
    const unique = new Map<string, Mention>()

    for (const mention of mentions){
        const key = getDuplicateKey(mention);
    }
}

// Handle duplicate
function getDuplicateKey(
    mention : Mention
) : string {
    const url = normalizeUrlForComparison(mention.url);

    // main URL
    if (url) {
    return `url:${url}`;
    }

    // example date format : 2026-08-19
    const date = mention.publishedAt
    ? mention.publishedAt.toISOString().slice(0, 10) 
    : ""

    return [
    "fallback",
    mention.sourceKey,
    normalizeTitleForComparison(mention.title),
    date,
  ].join("|");

}

// normalize URL for Comparison
function normalizeUrlForComparison(
    url : string | null
): string | null{
    if(!url){
        return null
    }

    // example : https://example.com/article
    return url
    .trim()
    .replace(/\/+$/, "")
    .toLowerCase();
}

// normalize title for Comparison
function normalizeTitleForComparison(
  title: string | null
): string {
  return (title ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}