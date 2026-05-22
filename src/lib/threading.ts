// Thread-Rekonstruktion: folgt In-Reply-To/References-Kette (RFC 5322 §3.6.4),
// um eine Konversation chronologisch zusammenzubauen.

export interface ThreadableMessage {
  uid: number;
  messageId: string | undefined;
  inReplyTo: string | undefined;
  references: string[] | undefined;
  date: Date;
  [key: string]: unknown;
}

export function reconstructThread(
  messages: ThreadableMessage[],
  rootUid: number,
): ThreadableMessage[] {
  if (messages.length === 0) return [];

  const byUid = new Map<number, ThreadableMessage>();
  const byMessageId = new Map<string, ThreadableMessage>();

  for (const msg of messages) {
    byUid.set(msg.uid, msg);
    if (msg.messageId) {
      byMessageId.set(msg.messageId, msg);
    }
  }

  const root = byUid.get(rootUid);
  if (!root) return [];

  const allMessageIds = new Set<string>();
  for (const msg of messages) {
    if (msg.messageId) allMessageIds.add(msg.messageId);
    if (msg.references) for (const ref of msg.references) allMessageIds.add(ref);
    if (msg.inReplyTo) allMessageIds.add(msg.inReplyTo);
  }

  const threadSet = new Set<number>();
  threadSet.add(rootUid);

  const seen = new Set<number>();
  const queue = [rootUid];

  while (queue.length > 0) {
    const currentUid = queue.pop()!;
    if (seen.has(currentUid)) continue;
    seen.add(currentUid);

    const current = byUid.get(currentUid);
    if (!current) continue;

    const relevantIds = new Set<string>();
    if (current.messageId) relevantIds.add(current.messageId);
    if (current.inReplyTo) relevantIds.add(current.inReplyTo);
    if (current.references) for (const ref of current.references) relevantIds.add(ref);

    for (const other of messages) {
      if (threadSet.has(other.uid)) continue;
      if (!other.inReplyTo && !other.references) continue;

      if (other.inReplyTo && relevantIds.has(other.inReplyTo)) {
        threadSet.add(other.uid);
        queue.push(other.uid);
        continue;
      }
      if (other.references) {
        for (const ref of other.references) {
          if (relevantIds.has(ref)) {
            threadSet.add(other.uid);
            queue.push(other.uid);
            break;
          }
        }
      }

      if (current.messageId && other.references?.includes(current.messageId)) {
        threadSet.add(other.uid);
        queue.push(other.uid);
      }
    }

    if (current.inReplyTo && byMessageId.has(current.inReplyTo)) {
      const parent = byMessageId.get(current.inReplyTo)!;
      threadSet.add(parent.uid);
      queue.push(parent.uid);
    }
    if (current.references) {
      for (const ref of current.references) {
        const refMsg = byMessageId.get(ref);
        if (refMsg) {
          threadSet.add(refMsg.uid);
          queue.push(refMsg.uid);
        }
      }
    }
  }

  const result = messages.filter((m) => threadSet.has(m.uid));
  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
}
