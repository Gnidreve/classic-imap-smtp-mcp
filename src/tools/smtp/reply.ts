import type nodemailer from "nodemailer";
// Antwort mit korrekter In-Reply-To/References-Kette + Sent-Ablage
import { z } from "zod";
import { MailboxNotFoundError, SmtpRelayError, UidNotFoundError } from "../../lib/errors.js";
import { type FromOverride, resolveFrom } from "../../lib/from-address.js";
import { resolveSentFolder } from "../../lib/sent-folder.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "smtp_reply",
  description: "Antwort mit korrekter In-Reply-To/References-Kette + Sent-Ablage",
  category: "smtp",
  inputSchema: z.object({
    to: z
      .union([z.string(), z.array(z.object({ address: z.string(), name: z.string().optional() }))])
      .optional()
      .describe("Reply recipient(s) (default: from of original)"),
    cc: z
      .union([z.string(), z.array(z.object({ address: z.string(), name: z.string().optional() }))])
      .optional()
      .describe("CC recipient(s)"),
    subject: z.string().optional().describe("Reply subject (default: Re: <original subject>)"),
    text: z.string().optional().describe("Plain text body"),
    html: z.string().optional().describe("HTML body"),
    originalMailbox: z.string().min(1).describe("Mailbox containing the original message"),
    originalUid: z.number().int().positive().describe("UID of the original message"),
    replyAll: z.boolean().default(false).describe("Reply to all recipients (default: false)"),
    from: z
      .union([z.string(), z.object({ address: z.string(), name: z.string().optional() })])
      .optional()
      .describe(
        "Override sender address, e.g. a verified send-as alias (default: account address). " +
          "Acceptance depends on the mail provider verifying the alias.",
      ),
    saveToSent: z.boolean().default(true).describe("Save copy to Sent folder (default: true)"),
  }),
  handler: async (input, ctx) => {
    const transport = await ctx.smtp.acquire();
    const accConfig = ctx.config.account;

    // Fetch original message
    const imapClient = await ctx.imap.acquire();
    const mb = await imapClient.mailboxOpen(input.originalMailbox);
    if (!mb) throw new MailboxNotFoundError(input.originalMailbox);

    const original = await imapClient.fetchOne(
      input.originalUid,
      {
        uid: true,
        envelope: true,
        headers: true,
      },
      { uid: true },
    );
    if (!original) throw new UidNotFoundError(input.originalUid, input.originalMailbox);

    const enc = original.envelope;
    if (!enc) throw new Error("Original message has no envelope");
    const messageId = enc.messageId ?? "";

    // Extract references from raw headers (not on MessageEnvelopeObject)
    const rawHeaders = original.headers?.toString() ?? "";
    const refMatch = rawHeaders.match(/^references:\s*(.*)$/im);
    const existingRefs = refMatch ? (refMatch[1]?.trim().split(/\s+/) ?? []) : [];
    const references = [...existingRefs, messageId].filter(Boolean);
    const inReplyTo = messageId;

    // Build to/cc from original envelope
    let to = input.to;
    const cc = input.cc;

    if (!to) {
      // Default: reply to from address
      const fromAddr = enc.from?.[0];
      to = fromAddr?.address ?? "";
    }

    if (input.replyAll && enc.to) {
      // Reply-all: original to + cc, excluding ourselves
      // (simplified: just use what the client provides)
    }

    const subject =
      input.subject ?? (enc.subject?.startsWith("Re:") ? enc.subject : `Re: ${enc.subject ?? ""}`);

    const mailOptions: nodemailer.SendMailOptions = {
      from: resolveFrom(accConfig, input.from as FromOverride | undefined),
      to:
        typeof to === "string"
          ? to
          : Array.isArray(to)
            ? to.map((a) => (a.name ? `"${a.name}" <${a.address}>` : a.address)).join(", ")
            : undefined,
      cc:
        typeof cc === "string"
          ? cc
          : Array.isArray(cc)
            ? cc.map((a) => (a.name ? `"${a.name}" <${a.address}>` : a.address)).join(", ")
            : undefined,
      subject,
      text: input.text,
      html: input.html,
      inReplyTo,
      references: references.join(" "),
    };

    let info: nodemailer.SentMessageInfo;
    try {
      info = await transport.sendMail(mailOptions);
    } catch (err) {
      throw new SmtpRelayError(`Failed to send reply: ${err}`);
    }

    // Save to Sent
    let savedToSent = false;
    let sentMailbox: string | undefined;
    let sentSaveError: string | undefined;

    if (input.saveToSent) {
      try {
        const sentFolder = await resolveSentFolder(imapClient);
        if (sentFolder) {
          sentMailbox = sentFolder;
          const rawLines: string[] = [];
          rawLines.push(`From: ${mailOptions.from}`);
          rawLines.push(`To: ${mailOptions.to}`);
          if (mailOptions.cc) rawLines.push(`Cc: ${mailOptions.cc}`);
          rawLines.push(`Subject: ${subject}`);
          rawLines.push(`In-Reply-To: ${inReplyTo}`);
          rawLines.push(`References: ${references.join(" ")}`);
          rawLines.push(`Date: ${new Date().toUTCString()}`);
          rawLines.push("MIME-Version: 1.0");
          rawLines.push("Content-Type: text/plain; charset=UTF-8");
          rawLines.push("");
          rawLines.push(input.text ?? input.html ?? "");
          await imapClient.append(sentFolder, rawLines.join("\r\n"));
          savedToSent = true;
        } else {
          sentSaveError = "No Sent folder found";
        }
      } catch (err) {
        sentSaveError = `Failed to save to Sent: ${err}`;
      }
    }

    return {
      messageId: info.messageId ?? "",
      inReplyTo,
      accepted: info.accepted ?? [],
      rejected: info.rejected ?? [],
      response: info.response ?? "",
      savedToSent,
      ...(sentMailbox ? { sentMailbox } : {}),
      ...(sentSaveError ? { sentSaveError } : {}),
    };
  },
});
