import type nodemailer from "nodemailer";
// Vor-formatierte RFC-822 senden (Power-User) + Sent-Ablage
import { z } from "zod";
import { SmtpRelayError } from "../../lib/errors.js";
import { parseEnvelopeAddresses } from "../../lib/mime.js";
import { resolveSentFolder } from "../../lib/sent-folder.js";
import { defineTool } from "../_types.js";

export default defineTool({
  name: "smtp_send_raw",
  description: "Vor-formatierte RFC-822 senden (Power-User) + Sent-Ablage",
  category: "smtp",
  inputSchema: z.object({
    raw: z.string().min(1).describe("Raw RFC-822 message content to send"),
    saveToSent: z.boolean().default(true).describe("Save copy to Sent folder (default: true)"),
  }),
  handler: async (input, ctx) => {
    const transport = await ctx.smtp.acquire();

    // Nodemailer leitet den SMTP-Envelope bei `raw` NICHT aus dem Rohtext ab
    // (setRaw speichert ihn unparsed, getEnvelope() sieht leere To/From-Header),
    // daher hier explizit aus den Headern parsen (siehe Issue #27).
    const envelope = await parseEnvelopeAddresses(input.raw);
    if (envelope.to.length === 0) {
      throw new SmtpRelayError(
        "Raw message has no To/Cc/Bcc recipients — cannot determine SMTP envelope",
      );
    }

    const mailOptions: nodemailer.SendMailOptions = {
      raw: input.raw,
      envelope: {
        from: envelope.from ?? ctx.config.account.user,
        to: envelope.to,
      },
    };

    let info: nodemailer.SentMessageInfo;
    try {
      info = await transport.sendMail(mailOptions);
    } catch (err) {
      throw new SmtpRelayError(`Failed to send raw email: ${err}`);
    }

    let savedToSent = false;
    let sentMailbox: string | undefined;
    let sentSaveError: string | undefined;

    if (input.saveToSent) {
      try {
        const imapClient = await ctx.imap.acquire();
        const sentFolder = await resolveSentFolder(imapClient);
        if (sentFolder) {
          sentMailbox = sentFolder;
          await imapClient.append(sentFolder, input.raw);
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
