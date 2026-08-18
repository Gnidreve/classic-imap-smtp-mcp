import type nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer/index.js";
// Mail senden + optionale Sent-Ablage
import { z } from "zod";
import { SmtpRelayError } from "../../lib/errors.js";
import { type FromOverride, resolveFrom } from "../../lib/from-address.js";
import { resolveSentFolder } from "../../lib/sent-folder.js";
import { defineTool } from "../_types.js";

function buildAddresses(
  list: Array<{ address: string; name?: string }> | string | undefined | null,
): string | string[] | undefined {
  if (!list) return undefined;
  if (typeof list === "string") return list;
  return list.map((a) => (a.name ? `"${a.name}" <${a.address}>` : a.address));
}

export default defineTool({
  name: "smtp_send",
  description: "Mail senden + optionale Sent-Ablage",
  category: "smtp",
  inputSchema: z.object({
    to: z
      .union([z.string(), z.array(z.object({ address: z.string(), name: z.string().optional() }))])
      .describe("Recipient(s)"),
    cc: z
      .union([z.string(), z.array(z.object({ address: z.string(), name: z.string().optional() }))])
      .optional()
      .describe("CC recipient(s)"),
    bcc: z
      .union([z.string(), z.array(z.object({ address: z.string(), name: z.string().optional() }))])
      .optional()
      .describe("BCC recipient(s)"),
    subject: z.string().min(1).describe("Email subject"),
    text: z.string().optional().describe("Plain text body"),
    html: z.string().optional().describe("HTML body"),
    attachments: z
      .array(
        z.object({
          filename: z.string().optional(),
          content: z.string().optional(),
          path: z.string().optional(),
          contentType: z.string().optional(),
          cid: z.string().optional(),
        }),
      )
      .optional()
      .describe("Attachments"),
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

    const mailOptions: nodemailer.SendMailOptions = {
      from: resolveFrom(accConfig, input.from as FromOverride | undefined),
      to: buildAddresses(input.to as string | Array<{ address: string; name?: string }>),
      cc: buildAddresses(
        input.cc as string | Array<{ address: string; name?: string }> | undefined,
      ),
      bcc: buildAddresses(
        input.bcc as string | Array<{ address: string; name?: string }> | undefined,
      ),
      subject: input.subject,
      text: input.text,
      html: input.html,
      attachments: input.attachments as unknown as Mail.Attachment[] | undefined,
    };

    let info: nodemailer.SentMessageInfo;
    try {
      info = await transport.sendMail(mailOptions);
    } catch (err) {
      throw new SmtpRelayError(`Failed to send email: ${err}`);
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
          const raw = await buildRfc822(mailOptions);
          await imapClient.append(sentFolder, raw);
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

async function buildRfc822(opts: nodemailer.SendMailOptions): Promise<string> {
  // Build a minimal RFC-822 message for the sent copy
  const lines: string[] = [];
  const from = opts.from as string;
  const to =
    typeof opts.to === "string" ? opts.to : Array.isArray(opts.to) ? opts.to.join(", ") : "";
  const date = new Date().toUTCString();

  lines.push(`From: ${from}`);
  lines.push(`To: ${to}`);
  if (opts.cc) {
    const ccStr =
      typeof opts.cc === "string"
        ? opts.cc
        : (opts.cc as Array<{ name?: string; address: string }>).map((a) => a.address).join(", ");
    lines.push(`Cc: ${ccStr}`);
  }
  lines.push(`Subject: ${opts.subject ?? ""}`);
  lines.push(`Date: ${date}`);
  lines.push("MIME-Version: 1.0");
  lines.push("Content-Type: text/plain; charset=UTF-8");
  lines.push("Content-Transfer-Encoding: 7bit");
  lines.push("");
  lines.push(opts.text ? (opts.text as string) : opts.html ? (opts.html as string) : "");

  return lines.join("\r\n");
}
