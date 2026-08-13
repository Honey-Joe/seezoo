import api from "./api";
import type { IDirectMessage, IConversation } from "../types";

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
  await api.post("/messages", {
    senderId, receiverId, text,
    senderName, senderUsername, senderImage,
    receiverName, receiverUsername, receiverImage,
  });
};

/* ── get messages between two users ── */
export const getMessages = async (
  partnerId: string,
): Promise<IDirectMessage[]> => {
  const res = await api.get<IDirectMessage[]>(`/messages/${partnerId}`);
  return res.data;
};

/* ── get conversation list ── */
export const getConversations = async (): Promise<IConversation[]> => {
  const res = await api.get<IConversation[]>("/messages");
  return res.data;
};

/* ── mark conversation as read ── */
export const markRead = async (partnerId: string): Promise<void> => {
  await api.patch(`/messages/${partnerId}/read`);
};

/* ── poll-based listeners (replaces Firebase onValue) ── */
export const listenMessages = (
  _myId: string,
  partnerId: string,
  callback: (msgs: IDirectMessage[]) => void
): (() => void) => {
  let active = true;

  const poll = async () => {
    try {
      const msgs = await getMessages(partnerId);
      if (active) callback(msgs);
    } catch { /* silent */ }
  };

  poll();
  const interval = setInterval(poll, 3000);
  return () => { active = false; clearInterval(interval); };
};

export const listenConversations = (
  _myId: string,
  callback: (convos: IConversation[]) => void
): (() => void) => {
  let active = true;

  const poll = async () => {
    try {
      const convos = await getConversations();
      if (active) callback(convos);
    } catch { /* silent */ }
  };

  poll();
  const interval = setInterval(poll, 5000);
  return () => { active = false; clearInterval(interval); };
};
