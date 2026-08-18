export interface SeedMention {
    external_id: string;
    source: string;
    title: string | null;
    content: string | null;
    url: string | null;
    author: string | null;
    published_at: string | number | null;
    engagement: number | string;
}