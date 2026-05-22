// Strukturierte Error-Klassen mit festen code-Strings (Client-sichtbar). Mapping 1:1 wie in AGENTS.md dokumentiert.
export type ErrorCode =
  | "AUTH_FAILED"
  | "MAILBOX_NOT_FOUND"
  | "UID_NOT_FOUND"
  | "ATTACHMENT_NOT_FOUND"
  | "ACCOUNT_NOT_FOUND"
  | "RATE_LIMITED"
  | "TLS_ERROR"
  | "CONFIG_ERROR"
  | "PERMISSION_DENIED"
  | "IMAP_PROTOCOL_ERROR"
  | "SMTP_RELAY_ERROR";

export class McpMailError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly imapResponse?: string,
  ) {
    super(message);
    this.name = new.target.name;
  }

  toResult() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details ? { details: this.details } : {}),
      ...(this.imapResponse ? { imap_response: this.imapResponse } : {}),
    };
  }
}

export class AuthError extends McpMailError {
  constructor(message = "Authentication failed", details?: Record<string, unknown>) {
    super("AUTH_FAILED", message, details);
  }
}
export class MailboxNotFoundError extends McpMailError {
  constructor(mailbox: string) {
    super("MAILBOX_NOT_FOUND", `Mailbox not found: ${mailbox}`, { mailbox });
  }
}
export class UidNotFoundError extends McpMailError {
  constructor(uid: number, mailbox: string) {
    super("UID_NOT_FOUND", `UID ${uid} not found in ${mailbox}`, { uid, mailbox });
  }
}
export class AttachmentNotFoundError extends McpMailError {
  constructor(ref: string) {
    super("ATTACHMENT_NOT_FOUND", `Attachment not found: ${ref}`, { ref });
  }
}
export class AccountNotFoundError extends McpMailError {
  constructor(account: string) {
    super("ACCOUNT_NOT_FOUND", `Account not configured: ${account}`, { account });
  }
}
export class RateLimitError extends McpMailError {
  constructor(message = "Rate limit exceeded") {
    super("RATE_LIMITED", message);
  }
}
export class TlsError extends McpMailError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("TLS_ERROR", message, details);
  }
}
export class ConfigError extends McpMailError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFIG_ERROR", message, details);
  }
}
export class PermissionError extends McpMailError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("PERMISSION_DENIED", message, details);
  }
}
export class ImapProtocolError extends McpMailError {
  constructor(message: string, imapResponse?: string) {
    super("IMAP_PROTOCOL_ERROR", message, undefined, imapResponse);
  }
}
export class SmtpRelayError extends McpMailError {
  constructor(message: string, details?: Record<string, unknown>) {
    super("SMTP_RELAY_ERROR", message, details);
  }
}
