// Provider-Auto-Detection: Mapping bekannter Mail-Domains auf IMAP/SMTP-Host/Port/TLS. Ergaenzt fehlende Felder beim Laden.
import type { TlsMode } from "./schema.js";

export interface ProviderPreset {
  imap_host: string;
  imap_port: number;
  imap_tls: TlsMode;
  smtp_host: string;
  smtp_port: number;
  smtp_tls: TlsMode;
}

// Domain (lowercase) -> Preset. Mehrere Domains koennen auf dasselbe Preset zeigen.
export const PROVIDERS: Record<string, ProviderPreset> = {
  "gmail.com": {
    imap_host: "imap.gmail.com",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "smtp.gmail.com",
    smtp_port: 465,
    smtp_tls: "implicit",
  },
  "outlook.com": {
    imap_host: "outlook.office365.com",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "smtp.office365.com",
    smtp_port: 587,
    smtp_tls: "starttls",
  },
  "hotmail.com": {
    imap_host: "outlook.office365.com",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "smtp.office365.com",
    smtp_port: 587,
    smtp_tls: "starttls",
  },
  "live.com": {
    imap_host: "outlook.office365.com",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "smtp.office365.com",
    smtp_port: 587,
    smtp_tls: "starttls",
  },
  "icloud.com": {
    imap_host: "imap.mail.me.com",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "smtp.mail.me.com",
    smtp_port: 587,
    smtp_tls: "starttls",
  },
  "me.com": {
    imap_host: "imap.mail.me.com",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "smtp.mail.me.com",
    smtp_port: 587,
    smtp_tls: "starttls",
  },
  "yahoo.com": {
    imap_host: "imap.mail.yahoo.com",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "smtp.mail.yahoo.com",
    smtp_port: 465,
    smtp_tls: "implicit",
  },
  "fastmail.com": {
    imap_host: "imap.fastmail.com",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "smtp.fastmail.com",
    smtp_port: 465,
    smtp_tls: "implicit",
  },
  "posteo.de": {
    imap_host: "posteo.de",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "posteo.de",
    smtp_port: 465,
    smtp_tls: "implicit",
  },
  "mailbox.org": {
    imap_host: "imap.mailbox.org",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "smtp.mailbox.org",
    smtp_port: 465,
    smtp_tls: "implicit",
  },
  "gmx.net": {
    imap_host: "imap.gmx.net",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "mail.gmx.net",
    smtp_port: 465,
    smtp_tls: "implicit",
  },
  "gmx.de": {
    imap_host: "imap.gmx.net",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "mail.gmx.net",
    smtp_port: 465,
    smtp_tls: "implicit",
  },
  "web.de": {
    imap_host: "imap.web.de",
    imap_port: 993,
    imap_tls: "implicit",
    smtp_host: "smtp.web.de",
    smtp_port: 587,
    smtp_tls: "starttls",
  },
  "proton.me": {
    imap_host: "127.0.0.1",
    imap_port: 1143,
    imap_tls: "starttls",
    smtp_host: "127.0.0.1",
    smtp_port: 1025,
    smtp_tls: "starttls",
  },
};

export function detectProvider(email: string): ProviderPreset | undefined {
  const domain = email.split("@")[1]?.toLowerCase();
  return domain ? PROVIDERS[domain] : undefined;
}
