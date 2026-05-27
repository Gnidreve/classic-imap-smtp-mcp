import { writeFileSync } from "node:fs";
// Gezielt eine MIME-Part extrahieren (Pfad oder Base64)
import { z } from "zod";
import {
  AttachmentNotFoundError,
  MailboxNotFoundError,
  UidNotFoundError,
} from "../../lib/errors.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "imap_download_attachment",
  description: "Gezielt eine MIME-Part extrahieren (Pfad oder Base64)",
  category: "imap-read",
  inputSchema: z.object({
    mailbox: z.string().min(1).describe("Mailbox path"),
    uid: z.number().int().positive().describe("Message UID"),
    partId: z.string().min(1).describe("MIME part ID (e.g. '1', '2.1')"),
    savePath: z.string().optional().describe("Local path to save the attachment"),
    account: z.string().optional().describe("Account name (default: default_account)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const client = await ctx.imap.acquire(accountName);

    const mb = await client.mailboxOpen(input.mailbox);
    if (!mb) throw new MailboxNotFoundError(input.mailbox);

    // FETCH specific body part + bodyStructure for metadata
    const msg = await client.fetchOne(
      input.uid,
      {
        uid: true,
        bodyParts: [input.partId],
        bodyStructure: true,
      },
      { uid: true },
    );

    if (!msg) throw new UidNotFoundError(input.uid, input.mailbox);

    const part = msg.bodyParts?.get(input.partId);
    if (!part) throw new AttachmentNotFoundError(`Part ${input.partId}`);

    // Resolve content-type and filename from bodyStructure
    let contentType = "application/octet-stream";
    let filename = `attachment-${input.partId}`;
    if (msg.bodyStructure) {
      contentType = msg.bodyStructure.type || contentType;
      filename =
        msg.bodyStructure.parameters?.name || msg.bodyStructure.parameters?.filename || filename;
    }

    const buffer = Buffer.from(part);
    const size = buffer.length;
    const base64 = buffer.toString("base64");

    if (input.savePath) {
      writeFileSync(input.savePath, buffer);
    }

    return {
      partId: input.partId,
      ...(filename ? { filename } : {}),
      contentType,
      size,
      ...(input.savePath ? { savedPath: input.savePath } : { base64 }),
    };
  },
});
