// MIME-Verarbeitung via mailparser: parst rohe RFC-822-Mails, extrahiert text/html/Attachments,
// dekodiert Encodings + Filenames (RFC 2231), liefert strukturierte Metadaten.
import { type ParsedMail, simpleParser } from "mailparser";
import type { Attachment } from "mailparser";

export interface ParsedBody {
  text?: string;
  html?: string;
}

export interface AttachmentMeta {
  partId: string;
  filename?: string;
  contentType: string;
  size: number;
  contentId?: string;
  disposition?: "inline" | "attachment";
}

export interface ParsedMessage {
  body: ParsedBody;
  attachments: AttachmentMeta[];
}

// Parst einen rohen RFC-822-String und extrahiert Text-/HTML-Body + Attachment-Metadaten.
export async function parseMime(raw: string): Promise<ParsedMessage> {
  const parsed: ParsedMail = await simpleParser(raw);

  const body: ParsedBody = {};
  if (parsed.text) body.text = parsed.text;
  if (parsed.html) body.html = parsed.html;

  const attachments: AttachmentMeta[] = (parsed.attachments || []).map(
    (a: Attachment, idx: number): AttachmentMeta => {
      const fn = a.filename || extractFilenameFromHeaders(a.headers);
      return {
        partId: a.related ? `related.${idx + 1}` : String(idx + 1),
        filename: fn ?? `attachment_${idx + 1}`,
        contentType: a.contentType || "application/octet-stream",
        size: a.size || a.content.length || 0,
        ...(a.contentId ? { contentId: a.contentId } : {}),
        ...(a.contentDisposition === "inline"
          ? { disposition: "inline" as const }
          : a.contentDisposition === "attachment"
            ? { disposition: "attachment" as const }
            : {}),
      };
    },
  );

  return { body, attachments };
}

// Extrahiert Filename aus Mail-Headers (Content-Disposition oder Content-Type).
function extractFilenameFromHeaders(headers: Map<string, unknown> | undefined): string | undefined {
  if (!headers) return undefined;
  // Prüfe Content-Disposition header auf filename/filename*
  const cd = headers.get("content-disposition");
  if (typeof cd === "string") {
    const m = cd.match(/filename\*?=(?:[^']*'[^']*')?([^;\s]+)/i);
    if (m) {
      try {
        const captured = m[1];
        return captured ? decodeURIComponent(captured) : undefined;
      } catch {
        return m[1];
      }
    }
    const m2 = cd.match(/filename="?([^";]*)"?/i);
    if (m2) return m2[1];
  }
  return undefined;
}
