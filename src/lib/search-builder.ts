// IMAP-SEARCH-Builder: übersetzt strukturierte Suchkriterien (alle RFC-3501-Felder) in imapflow-Query-Objekte.
// imapflow akzeptiert ein SearchQuery-Objekt mit Eigenschaften wie from, to, subject, body, text,
// since, before, on, sentSince, sentBefore, sentOn, larger, smaller, unseen, seen, flagged,
// unflagged, answered, unanswered, deleted, undeleted, keyword, unkeyword, new, old, recent, etc.

export interface SearchCriteria {
  from?: string;
  to?: string;
  cc?: string;
  bcc?: string;
  subject?: string;
  body?: string;
  text?: string;
  since?: string; // DD-Mon-YYYY
  before?: string;
  on?: string;
  sentSince?: string;
  sentBefore?: string;
  sentOn?: string;
  larger?: number;
  smaller?: number;
  unseen?: boolean;
  seen?: boolean;
  flagged?: boolean;
  unflagged?: boolean;
  answered?: boolean;
  unanswered?: boolean;
  deleted?: boolean;
  undeleted?: boolean;
  keyword?: string;
  unkeyword?: string;
  new?: boolean;
  old?: boolean;
  recent?: boolean;
}

// Normalisiert ein Datum von DD-Mon-YYYY oder ISO in ein imapflow-kompatibles Date-Objekt.
function parseSearchDate(value: string): Date {
  // ISO 8601: "2026-05-21" or "2026-05-21T14:30:00Z"
  const isoMatch = value.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return new Date(isoMatch[0]);

  // RFC 3501: "21-May-2026"
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;

  // Fallback mit Monats-Mapping
  const months: Record<string, string> = {
    jan: "01",
    feb: "02",
    mar: "03",
    apr: "04",
    may: "05",
    jun: "06",
    jul: "07",
    aug: "08",
    sep: "09",
    oct: "10",
    nov: "11",
    dec: "12",
  };
  const parts = value.split("-");
  if (parts.length === 3) {
    // biome-ignore lint/style/noNonNullAssertion: parts.length === 3 verified above
    const day = parts[0]!.padStart(2, "0");
    const monKey = parts[1]?.toLowerCase().slice(0, 3);
    const mon = monKey ? months[monKey] : undefined;
    // biome-ignore lint/style/noNonNullAssertion: parts.length === 3 verified above
    const yearRaw = parts[2]!;
    const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
    if (mon && day) return new Date(`${year}-${mon}-${day}`);
  }

  throw new Error(
    `Cannot parse date: ${value}. Use DD-Mon-YYYY (e.g., 21-May-2026) or YYYY-MM-DD.`,
  );
}

// Übersetzt strukturierte Suchkriterien in ein imapflow-SearchQuery-Objekt.
export function buildSearchQuery(criteria: SearchCriteria): Record<string, unknown> {
  const query: Record<string, unknown> = {};

  if (criteria.from !== undefined) query.from = criteria.from;
  if (criteria.to !== undefined) query.to = criteria.to;
  if (criteria.cc !== undefined) query.cc = criteria.cc;
  if (criteria.bcc !== undefined) query.bcc = criteria.bcc;
  if (criteria.subject !== undefined) query.subject = criteria.subject;
  if (criteria.body !== undefined) query.body = criteria.body;
  if (criteria.text !== undefined) query.text = criteria.text;

  if (criteria.since !== undefined) query.since = parseSearchDate(criteria.since);
  if (criteria.before !== undefined) query.before = parseSearchDate(criteria.before);
  if (criteria.on !== undefined) query.on = parseSearchDate(criteria.on);
  if (criteria.sentSince !== undefined) query.sentSince = parseSearchDate(criteria.sentSince);
  if (criteria.sentBefore !== undefined) query.sentBefore = parseSearchDate(criteria.sentBefore);
  if (criteria.sentOn !== undefined) query.sentOn = parseSearchDate(criteria.sentOn);

  if (criteria.larger !== undefined) query.larger = criteria.larger;
  if (criteria.smaller !== undefined) query.smaller = criteria.smaller;

  if (criteria.unseen !== undefined) query.unseen = criteria.unseen;
  if (criteria.seen !== undefined) query.seen = criteria.seen;
  if (criteria.flagged !== undefined) query.flagged = criteria.flagged;
  if (criteria.unflagged !== undefined) query.unflagged = criteria.unflagged;
  if (criteria.answered !== undefined) query.answered = criteria.answered;
  if (criteria.unanswered !== undefined) query.unanswered = criteria.unanswered;
  if (criteria.deleted !== undefined) query.deleted = criteria.deleted;
  if (criteria.undeleted !== undefined) query.undeleted = criteria.undeleted;
  if (criteria.new !== undefined) query.new = criteria.new;
  if (criteria.old !== undefined) query.old = criteria.old;
  if (criteria.recent !== undefined) query.recent = criteria.recent;

  if (criteria.keyword !== undefined) query.keyword = criteria.keyword;
  if (criteria.unkeyword !== undefined) query.unkeyword = criteria.unkeyword;

  return query;
}
