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

export interface Mention {
    id: string;
    externalId: string;

    source: string;
    sourceKey: string;

    title: string | null;
    content: string | null;
    url: string | null;
    author: string | null;

    publishedAt: Date | null;
    engagement: number;
}

export interface MentionSearchFilters {
  q?: string;
  source?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}