import type nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer/index.js";
// Weiterleiten (Original quoted oder als Attachment) + Sent-Ablage
import { z } from "zod";
import { MailboxNotFoundError, SmtpRelayError, UidNotFoundError } from "../../lib/errors.js";
import { resolveSentFolder } from "../../lib/sent-folder.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "smtp_forward",
  description: "Weiterleiten (Original quoted oder als Attachment) + Sent-Ablage",
  category: "smtp",
  inputSchema: z.object({
    to: z
      .union([z.string(), z.array(z.object({ address: z.string(), name: z.string().optional() }))])
      .describe("Forward recipient(s)"),
    cc: z
      .union([z.string(), z.array(z.object({ address: z.string(), name: z.string().optional() }))])
      .optional()
      .describe("CC recipient(s)"),
    bcc: z
      .union([z.string(), z.array(z.object({ address: z.string(), name: z.string().optional() }))])
      .optional()
      .describe("BCC recipient(s)"),
    subject: z.string().optional().describe("Forward subject (default: Fwd: <original subject>)"),
    text: z.string().optional().describe("Additional plain text body"),
    html: z.string().optional().describe("Additional HTML body"),
    originalMailbox: z.string().min(1).describe("Mailbox containing the original message"),
    originalUid: z.number().int().positive().describe("UID of the original message"),
    forwardAsAttachment: z
      .boolean()
      .default(false)
      .describe("Forward as attachment (RFC-822) (default: false)"),
    account: z.string().optional().describe("Account name (default: default_account)"),
    saveToSent: z.boolean().default(true).describe("Save copy to Sent folder (default: true)"),
  }),
  handler: async (input, ctx) => {
    const accountName = ctx.resolveAccount(input.account);
    const transport = await ctx.smtp.acquire(accountName);
    const accConfig = ctx.config.accounts.get(accountName)!;

    // Fetch original message
    const imapClient = await ctx.imap.acquire(accountName);
    const mb = await imapClient.mailboxOpen(input.originalMailbox);
    if (!mb) throw new MailboxNotFoundError(input.originalMailbox);

    const original = await imapClient.fetchOne(input.originalUid, {
      uid: true,
      envelope: true,
      source: true,
    });
    if (!original) throw new UidNotFoundError(input.originalUid, input.originalMailbox);

    const enc = original.envelope;
    if (!enc) throw new Error("Original message has no envelope");
    const subject =
      input.subject ??
      (enc.subject?.startsWith("Fwd:") ? enc.subject : `Fwd: ${enc.subject ?? ""}`);

    const mailOptions: nodemailer.SendMailOptions = {
      from: accConfig.from_name ? `"${accConfig.from_name}" <${accConfig.user}>` : accConfig.user,
      to:
        typeof input.to === "string"
          ? input.to
          : input.to.map((a) => (a.name ? `"${a.name}" <${a.address}>` : a.address)).join(", "),
      cc: input.cc
        ? typeof input.cc === "string"
          ? input.cc
          : input.cc.map((a) => (a.name ? `"${a.name}" <${a.address}>` : a.address)).join(", ")
        : undefined,
      bcc: input.bcc
        ? typeof input.bcc === "string"
          ? input.bcc
          : input.bcc.map((a) => (a.name ? `"${a.name}" <${a.address}>` : a.address)).join(", ")
        : undefined,
      subject,
    };

    if (input.forwardAsAttachment) {
      // Forward original as RFC-822 attachment
      const rawSource = original.source?.toString() ?? "";
      (mailOptions as Record<string, unknown>).attachments = [
        {
          filename: `forwarded-${input.originalUid}.eml`,
          content: rawSource,
          contentType: "message/rfc822",
        },
      ];
      mailOptions.text = input.text ?? "";
      mailOptions.html = input.html ?? "";
    } else {
      // Inline: quote original
      const fromStr = enc.from
        ? Array.isArray(enc.from)
          ? enc.from.map((f: { address?: string }) => f.address ?? "").join(", ")
          : ""
        : "";
      const toStr = enc.to
        ? Array.isArray(enc.to)
          ? enc.to.map((t: { address?: string }) => t.address ?? "").join(", ")
          : ""
        : "";
      const dateStr = enc.date ? enc.date.toISOString() : new Date().toISOString();
      const quotedBody = original.source?.toString() ?? "";
      const quotedText = input.text
        ? `${input.text}\n\n-------- Forwarded Message --------\nSubject: ${enc.subject ?? ""}\nDate: ${dateStr}\nFrom: ${fromStr}\nTo: ${toStr}\n\n${quotedBody}`
        : `-------- Forwarded Message --------\nSubject: ${enc.subject ?? ""}\nDate: ${dateStr}\nFrom: ${fromStr}\nTo: ${toStr}\n\n${quotedBody}`;
      mailOptions.text = quotedText;
    }

    let info: nodemailer.SentMessageInfo;
    try {
      info = await transport.sendMail(mailOptions);
    } catch (err) {
      throw new SmtpRelayError(`Failed to forward email: ${err}`);
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
          rawLines.push(`Date: ${new Date().toUTCString()}`);
          rawLines.push("MIME-Version: 1.0");
          rawLines.push("Content-Type: text/plain; charset=UTF-8");
          rawLines.push("");
          rawLines.push(mailOptions.text ?? "");
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
      accepted: info.accepted ?? [],
      rejected: info.rejected ?? [],
      response: info.response ?? "",
      savedToSent,
      ...(sentMailbox ? { sentMailbox } : {}),
      ...(sentSaveError ? { sentSaveError } : {}),
    };
  },
});
