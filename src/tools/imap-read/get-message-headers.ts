// Nur Header einer Mail
import { z } from "zod";
import { MailboxNotFoundError, UidNotFoundError } from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_get_message_headers",
  description: "Nur Header einer Mail",
  category: "imap-read",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path"),
    uid: z.number().int().positive().describe("Message UID"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    const mailbox = await client.mailboxOpen(input.mailbox);
    if (!mailbox) throw new MailboxNotFoundError(input.mailbox);

    const msg = await client.fetchOne(input.uid, {
      uid: true,
      headers: true,
    });

    if (!msg) throw new UidNotFoundError(input.uid, input.mailbox);

    // Parse headers from the headers Buffer
    const rawHeaders = msg.headers?.toString() ?? "";
    const headers: Record<string, string | string[]> = {};

    const lines = rawHeaders.split("\r\n");
    let currentKey: string | null = null;
    let currentValue: string | null = null;

    for (const line of lines) {
      // Continuation line (folded header)
      if ((line.startsWith(" ") || line.startsWith("\t")) && currentKey) {
        if (currentValue) {
          currentValue += ` ${line.trim()}`;
        }
        continue;
      }

      // Save previous header
      if (currentKey && currentValue) {
        const existing = headers[currentKey];
        if (existing) {
          if (Array.isArray(existing)) {
            existing.push(currentValue);
          } else {
            headers[currentKey] = [existing, currentValue];
          }
        } else {
          headers[currentKey] = currentValue;
        }
      }

      const colonIdx = line.indexOf(":");
      if (colonIdx > 0) {
        currentKey = line.slice(0, colonIdx).trim();
        currentValue = line.slice(colonIdx + 1).trim();
      } else {
        currentKey = null;
        currentValue = null;
      }
    }

    // Don't forget the last header
    if (currentKey && currentValue) {
      const existing = headers[currentKey];
      if (existing) {
        if (Array.isArray(existing)) {
          existing.push(currentValue);
        } else {
          headers[currentKey] = [existing, currentValue];
        }
      } else {
        headers[currentKey] = currentValue;
      }
    }

    return {
      uid: msg.uid,
      headers,
    };
  },
});
