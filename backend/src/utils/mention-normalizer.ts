import { Mention, SeedMention } from "../models/mention.model";
import { randomUUID } from "crypto";
import * as cheerio from "cheerio";

export function normalizeMention(
    mention: SeedMention
): Mention {
    const source = normalizeSource(mention.source);

    return {
        id: randomUUID(),
        externalId: mention.external_id,
        source: source.name,
        sourceKey: source.key,
        title: normalizeTitle(mention.title),
        content: normalizeContent(mention.content),
        url : normalizeUrl(mention.url),
        author: normalizeAuthor(mention.author),
        publishedAt: normalizePublishedAt(mention.published_at),
        engagement : normalizeEngagement(mention.engagement)
    };
}

// SOURCE
export function normalizeSource(source: string): {
    name: string,
    key: string
} {
    // Cleaning source
    const cleaned = source
        .trim()
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

    // Change the format key, for example "The Star" -> "thestar"
    const key = cleaned
        .toLowerCase()
        .replace(/[\s_-]+/g, "");

    // Change the name format, for example ""twitter media monitoring"" -> "Twitter Media Monitoring"
    const name = cleaned
        .toLowerCase()
        .replace(
            /\b\w/g,
            (char) => char.toUpperCase()
        );
        
    return {
        name,
        key,
    };
}

// TITLE
export function normalizeTitle(
    title: string | null
): string | null {

    if (title === null) {
        return null
    }

    const cleaned = title.trim()

    return cleaned.length > 0
        ? cleaned
        : null
}

// CONTENT
export function normalizeContent(
    content: string | null
): string | null {

    if (content === null) {
        return null;
    }

    //   delete Script/style content
    const $ = cheerio.load(content)
    $("script, style").remove()

    const text = $.root().text()

    return text
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();


}

//  URL
export function normalizeUrl(
  url: string | null
): string | null {

  if (url === null) {
    return null;
  }

  const cleaned = url.trim();

  if (!cleaned) {
    return null;
  }

  return cleaned.replace(/\/+$/, "");
}

// AUTHOR
export function normalizeAuthor(
  author: string | null
): string | null {
  if (author === null) {
    return null;
  }

  const cleaned = author.trim();

  return cleaned.length > 0
    ? cleaned
    : null;
}

// PUBLISH

export function normalizePublishedAt(
  value: string | number | null
): Date | null {
  if (value === null) {
    return null;
  }

  // Handle Unix timestamp.
  if (typeof value === "number") {
    // default javascript milliseconds
    const date = new Date(value * 1000);
    // check valid
    if (Number.isNaN(date.getTime())) {
      throw new Error(
        `Invalid published_at timestamp: ${value}`
      );
    }
    return date;
  }

  // "19/08/2026"
  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  const dateOnlyMatch = cleaned.match(
    /^(\d{2})\/(\d{2})\/(\d{4})$/
  );
  /**
       * [
      "19/08/2026",
      "19",
      "08",
      "2026"
    ]
   */

  if (dateOnlyMatch) {
    const [, day, month, year] =
      dateOnlyMatch;

    const date = new Date(
      `${year}-${month}-${day}T00:00:00Z`
    );

    if (Number.isNaN(date.getTime())) {
      throw new Error(
        `Invalid published_at date: ${value}`
      );
    }
    return date;
  }

  const date = new Date(cleaned);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `Unsupported published_at format: ${value}`
    );
  }

  return date;
}

// ENGAGEMENT
export function normalizeEngagement(
  engagement : number | string
): number{
  // check number and valid
  if (typeof engagement === "number") {
    if (!Number.isFinite(engagement)) {
      throw new Error(
        `Invalid engagement value: ${engagement}`
      );
    }
    return engagement;
  }

  // delete coma and space
  const cleaned = engagement
    .replace(/,/g, "")
    .trim();

  const value = Number(cleaned);
  if (!Number.isFinite(value)) {
    throw new Error(
      `Invalid engagement value: ${engagement}`
    );
  }

  return value;
}