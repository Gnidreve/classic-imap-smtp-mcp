// Zentraler Tool-Index: importiert alle 36 Tool-Definitionen und exportiert sie als flaches Array. Einzige Stelle, die jedes Tool kennt.
import type { ToolDefinition } from "./_types.js";

import checkCapabilities from "./imap-read/check-capabilities.js";
import downloadAttachment from "./imap-read/download-attachment.js";
import getMessageHeaders from "./imap-read/get-message-headers.js";
import getMessageRaw from "./imap-read/get-message-raw.js";
import getMessage from "./imap-read/get-message.js";
import getMessagesBulk from "./imap-read/get-messages-bulk.js";
import getQuota from "./imap-read/get-quota.js";
import getThread from "./imap-read/get-thread.js";
// IMAP-Read
import listMailboxes from "./imap-read/list-mailboxes.js";
import listMessages from "./imap-read/list-messages.js";
import search from "./imap-read/search.js";
import statusMailbox from "./imap-read/status-mailbox.js";

import appendMessage from "./imap-write/append-message.js";
import bulkMark from "./imap-write/bulk-mark.js";
import bulkMove from "./imap-write/bulk-move.js";
import copyMessage from "./imap-write/copy-message.js";
import deleteMessage from "./imap-write/delete-message.js";
import expunge from "./imap-write/expunge.js";
// IMAP-Write
import markMessage from "./imap-write/mark-message.js";
import moveMessage from "./imap-write/move-message.js";

// IMAP-Folder-CRUD
import createMailbox from "./imap-mailbox/create-mailbox.js";
import deleteMailbox from "./imap-mailbox/delete-mailbox.js";
import renameMailbox from "./imap-mailbox/rename-mailbox.js";
import subscribeMailbox from "./imap-mailbox/subscribe-mailbox.js";
import unsubscribeMailbox from "./imap-mailbox/unsubscribe-mailbox.js";

import smtpForward from "./smtp/forward.js";
import smtpReply from "./smtp/reply.js";
import smtpSendRaw from "./smtp/send-raw.js";
// SMTP
import smtpSend from "./smtp/send.js";
import smtpVerifyConnection from "./smtp/verify-connection.js";

import accountAdd from "./account/add.js";
import accountDelete from "./account/delete.js";
// Account
import accountList from "./account/list.js";
import accountUpdate from "./account/update.js";

// Meta
import metaHealth from "./meta/health.js";
import metaServerInfo from "./meta/server-info.js";

export const ALL_TOOLS: ToolDefinition<any, any>[] = [
  listMailboxes,
  statusMailbox,
  listMessages,
  getMessage,
  getMessageHeaders,
  getMessageRaw,
  getMessagesBulk,
  search,
  downloadAttachment,
  getThread,
  getQuota,
  checkCapabilities,
  markMessage,
  bulkMark,
  moveMessage,
  copyMessage,
  bulkMove,
  appendMessage,
  expunge,
  deleteMessage,
  createMailbox,
  deleteMailbox,
  renameMailbox,
  subscribeMailbox,
  unsubscribeMailbox,
  smtpSend,
  smtpReply,
  smtpForward,
  smtpVerifyConnection,
  smtpSendRaw,
  accountList,
  accountAdd,
  accountUpdate,
  accountDelete,
  metaHealth,
  metaServerInfo,
];
