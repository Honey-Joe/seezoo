import {
  ref, push, set, onValue, off,
  serverTimestamp, update, get,
} from "firebase/database";
import api from "./api";
import { db } from "../lib/firebase";
import type { IDirectMessage, IConversation } from "../types";

const convoId = (a: string, b: string) => [a, b].sort().join("_");

/* ── fetch user info from our API and patch RTDB node ── */
const enrichConvo = async (myId: string, partnerId: string): Promise<{ name: string; username: string; profileImage?: string }> => {
  try {
    const res = await api.get<{ _id: string; name: string; username: string; profileImage?: string }>(`/user/id/${partnerId}`);
    const u = res.data;
    // Patch RTDB so future loads don't need to fetch again
    await update(ref(db, `conversations/${myId}/${partnerId}`), {
      partnerName:     u.name,
      partnerUsername: u.username,
      ...(u.profileImage ? { partnerImage: u.profileImage } : {}),
    });
    return { name: u.name, username: u.username, profileImage: u.profileImage };
  } catch {
    return { name: partnerId.slice(0, 8), username: partnerId.slice(0, 8) };
  }
};

/* ── send a message ── */
export const sendMessage = async (
  senderId: string,
  receiverId: string,
  text: string,
  senderName: string,
  senderUsername: string,
  senderImage: string | undefined,
  receiverName: string,
  receiverUsername: string,
  receiverImage: string | undefined,
): Promise<void> => {
  const cid    = convoId(senderId, receiverId);
  const msgRef = push(ref(db, `messages/${cid}`));

  await set(msgRef, {
    id: msgRef.key!,
    senderId,
    receiverId,
    text: text.trim(),
    createdAt: Date.now(),
    read: false,
  });

  const unreadSnap = await get(ref(db, `conversations/${receiverId}/${senderId}/unread`));
  const unread = ((unreadSnap.val() as number) ?? 0) + 1;

  await Promise.all([
    update(ref(db, `conversations/${senderId}/${receiverId}`), {
      partnerId:       receiverId,
      partnerName:     receiverName,
      partnerUsername: receiverUsername,
      ...(receiverImage ? { partnerImage: receiverImage } : {}),
      lastMessage: text.trim(),
      lastAt:      serverTimestamp(),
      unread:      0,
    }),
    update(ref(db, `conversations/${receiverId}/${senderId}`), {
      partnerId:       senderId,
      partnerName:     senderName,
      partnerUsername: senderUsername,
      ...(senderImage ? { partnerImage: senderImage } : {}),
      lastMessage: text.trim(),
      lastAt:      serverTimestamp(),
      unread,
    }),
  ]);
};

/* ── listen to messages ── */
export const listenMessages = (
  myId: string,
  partnerId: string,
  callback: (msgs: IDirectMessage[]) => void
): (() => void) => {
  const path    = `messages/${convoId(myId, partnerId)}`;
  const msgsRef = ref(db, path);

  const handler = onValue(
    msgsRef,
    (snap) => {
      const msgs: IDirectMessage[] = [];
      snap.forEach((child) => {
        const val = child.val();
        if (val) msgs.push({ ...val, id: child.key! });
      });
      msgs.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      callback(msgs);
    },
    (error) => {
      console.error("listenMessages error:", error);
    }
  );

  // Return unsubscribe — use the same ref instance
  return () => off(msgsRef, "value", handler);
};

/* ── mark read ── */
export const markRead = (myId: string, partnerId: string): Promise<void> =>
  update(ref(db, `conversations/${myId}/${partnerId}`), { unread: 0 });

/* ── listen to conversations — auto-enriches missing partner info ── */
export const listenConversations = (
  myId: string,
  callback: (convos: IConversation[]) => void
): (() => void) => {
  const convosRef = ref(db, `conversations/${myId}`);

  const handler = onValue(convosRef, async (snap) => {
    const raw: IConversation[] = [];
    snap.forEach((child) => {
      raw.push({ ...(child.val() as IConversation), partnerId: child.key! });
    });

    // Enrich any convos missing partnerName in parallel
    const enriched = await Promise.all(
      raw.map(async (c) => {
        if (c.partnerName && c.partnerUsername) return c;
        const info = await enrichConvo(myId, c.partnerId);
        return { ...c, partnerName: info.name, partnerUsername: info.username, partnerImage: info.profileImage ?? c.partnerImage };
      })
    );

    enriched.sort((a, b) => (b.lastAt ?? 0) - (a.lastAt ?? 0));
    callback(enriched);
  });

  return () => off(convosRef, "value", handler);
};
