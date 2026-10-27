import type { ReactNode } from "react";
import { GLOSSARY_TERMS, type GlossaryTerm } from "./glossary-data";
import { GlossaryTooltip } from "@/components/common/GlossaryTooltip";

// Map of term string to GlossaryTerm object for fast lookup
const termLookup = new Map<string, GlossaryTerm>();
for (const item of GLOSSARY_TERMS) {
  termLookup.set(item.term.toLowerCase(), item);
  for (const alias of item.aliases || []) {
    termLookup.set(alias.toLowerCase(), item);
  }
}

// English aliases must be whole identifiers: pthread_join is not the word Thread.
// Korean particles stay attached to terms, so Korean matches keep their existing behavior.
const allKeywords = Array.from(termLookup.keys()).sort((a, b) => b.length - a.length);
const pattern = new RegExp(`(${allKeywords.map((keyword) => {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return /^[a-z0-9_]/i.test(keyword)
    ? `(?<![a-z0-9_])${escaped}(?![a-z0-9_])`
    : escaped;
}).join("|")})`, "gi");

export function annotateGlossaryTerms(text: string): ReactNode {
  if (!text || typeof text !== "string") return text;

  const parts = text.split(pattern);
  if (parts.length <= 1) return text;

  return parts.map((part, index) => {
    const matched = termLookup.get(part.toLowerCase());
    if (matched) {
      return (
        <GlossaryTooltip key={`${part}-${index}`} term={matched}>
          {part}
        </GlossaryTooltip>
      );
    }
    return part;
  });
}
