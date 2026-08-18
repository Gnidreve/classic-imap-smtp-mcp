// Regressionstest für Issue #27: smtp_send_raw schlug immer mit "No recipients defined" fehl,
// weil kein SMTP-Envelope aus dem rohen Header geparst/übergeben wurde.
import { describe, expect, it, vi } from "vitest";
import type { ToolContext } from "../_types.js";
import sendRaw from "./send-raw.js";

const RAW_WITH_RECIPIENTS = [
  "From: Sender <sender@example.com>",
  "To: Recipient <recipient@example.com>",
  "Subject: Test",
  "Date: Wed, 12 Aug 2026 10:00:00 +0000",
  "Message-ID: <test@example.com>",
  "MIME-Version: 1.0",
  "Content-Type: text/plain; charset=utf-8",
  "",
  "Hello",
].join("\r\n");

const RAW_WITHOUT_RECIPIENTS = [
  "From: Sender <sender@example.com>",
  "Subject: Test",
  "Date: Wed, 12 Aug 2026 10:00:00 +0000",
  "MIME-Version: 1.0",
  "Content-Type: text/plain; charset=utf-8",
  "",
  "Hello",
].join("\r\n");

describe("smtp_send_raw", () => {
  it("builds an explicit envelope from To/Cc/Bcc headers instead of relying on nodemailer's raw parsing", async () => {
    const sendMail = vi.fn().mockResolvedValue({
      messageId: "<abc@example.com>",
      accepted: ["recipient@example.com"],
      rejected: [],
      response: "250 OK",
    });
    const ctx: ToolContext = {
      config: { account: { user: "sender@example.com" } } as ToolContext["config"],
      smtp: { acquire: async () => ({ sendMail }) } as unknown as ToolContext["smtp"],
      imap: {} as ToolContext["imap"],
      logger: {} as ToolContext["logger"],
      flags: {} as ToolContext["flags"],
      activeTools: [],
    };

    const result = await sendRaw.handler({ raw: RAW_WITH_RECIPIENTS, saveToSent: false }, ctx);

    expect(sendMail).toHaveBeenCalledTimes(1);
    const mailOptions = sendMail.mock.calls[0][0];
    expect(mailOptions.envelope).toEqual({
      from: "sender@example.com",
      to: ["recipient@example.com"],
    });
    expect(result.messageId).toBe("<abc@example.com>");
  });

  it("throws a clear SmtpRelayError when the raw message has no recipients", async () => {
    const sendMail = vi.fn();
    const ctx: ToolContext = {
      config: { account: { user: "sender@example.com" } } as ToolContext["config"],
      smtp: { acquire: async () => ({ sendMail }) } as unknown as ToolContext["smtp"],
      imap: {} as ToolContext["imap"],
      logger: {} as ToolContext["logger"],
      flags: {} as ToolContext["flags"],
      activeTools: [],
    };

    await expect(
      sendRaw.handler({ raw: RAW_WITHOUT_RECIPIENTS, saveToSent: false }, ctx),
    ).rejects.toThrow(/recipients/i);
    expect(sendMail).not.toHaveBeenCalled();
  });
});
