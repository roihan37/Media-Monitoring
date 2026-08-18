import { Mention, SeedMention } from "../models/mention.model";
import { randomUUID } from "crypto";

export function normalizeMention(
  mention: SeedMention
): Mention {
  const source = normalizeSource(mention.source);

  return {
    id: randomUUID(),
    externalId: mention.external_id,
    source: source.name,
    sourceKey: source.key,
    
  };
}

function normalizeSource(source : string) : {
    name : string,
    key : string
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