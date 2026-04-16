import { useEffect, useRef, useState, useCallback } from "react";
import { useAppSelector } from "../store";
import { getConversations, getHistory } from "../services/messageService";
import { getFollowing } from "../services/userService";
import { getSocket } from "../services/socketService";
import type { IConversation, IDirectMessage, IFollowRequester } from "../types";

/* ── small helpers ── */
const Avatar = ({ user, online }: { user: IFollowRequester; online?: boolean }) => (
  <div className="relative shrink-0">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
      {user.profileImage
        ? <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
        : user.name.charAt(0).toUpperCase()
      }
    </div>
    {online !== undefined && (
      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? "bg-green-400" : "bg-gray-300"}`} />
    )}
  </div>
);

const Messages = () => {
  const me = useAppSelector((s) => s.auth.user);

  const [conversations,  setConversations]  = useState<IConversation[]>([]);
  const [following,      setFollowing]      = useState<IFollowRequester[]>([]);
  const [activePartner,  setActivePartner]  = useState<IFollowRequester | null>(null);
  const [messages,       setMessages]       = useState<IDirectMessage[]>([]);
  const [text,           setText]           = useState("");
  const [onlineIds,      setOnlineIds]      = useState<Set<string>>(new Set());
  const [typingFrom,     setTypingFrom]     = useState<Set<string>>(new Set());
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showSidebar,    setShowSidebar]    = useState(true);

  const bottomRef    = useRef<HTMLDivElement>(null);
  const typingTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── load conversations + following on mount ── */
  useEffect(() => {
    if (!me) return;
    getConversations().then((r) => setConversations(r.data)).catch(() => {});
    getFollowing(me._id).then((r) => setFollowing(r.data)).catch(() => {});
  }, [me]);

  /* ── socket setup ── */
  useEffect(() => {
    if (!me) return;
    const socket = getSocket();

    socket.on("online:list",    (ids: string[]) => setOnlineIds(new Set(ids)));
    socket.on("user:online",    (id: string)    => setOnlineIds((s) => new Set([...s, id])));
    socket.on("user:offline",   (id: string)    => setOnlineIds((s) => { const n = new Set(s); n.delete(id); return n; }));
    socket.on("typing:start",   (id: string)    => setTypingFrom((s) => new Set([...s, id])));
    socket.on("typing:stop",    (id: string)    => setTypingFrom((s) => { const n = new Set(s); n.delete(id); return n; }));

    socket.on("message:receive", (msg: IDirectMessage) => {
      setMessages((prev) => {
        if (activePartnerRef.current?._id === msg.sender) return [...prev, msg];
        return prev;
      });
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.partner._id === msg.sender);
        const updated = { ...prev[idx] ?? {}, lastMessage: msg, unread: (prev[idx]?.unread ?? 0) + 1 };
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = updated as IConversation;
          return copy;
        }
        return prev;
      });
    });

    socket.on("message:sent", (msg: IDirectMessage) => {
      setMessages((prev) => [...prev, msg]);
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.partner._id === msg.receiver);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = { ...copy[idx], lastMessage: msg };
          return copy;
        }
        return prev;
      });
    });

    return () => {
      socket.off("online:list");
      socket.off("user:online");
      socket.off("user:offline");
      socket.off("typing:start");
      socket.off("typing:stop");
      socket.off("message:receive");
      socket.off("message:sent");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  // Keep a ref to activePartner so socket callbacks can read it
  const activePartnerRef = useRef<IFollowRequester | null>(null);
  useEffect(() => { activePartnerRef.current = activePartner; }, [activePartner]);

  /* ── open conversation ── */
  const openChat = useCallback(async (partner: IFollowRequester) => {
    setActivePartner(partner);
    setShowSidebar(false);
    setMessages([]);
    setLoadingHistory(true);
    try {
      const r = await getHistory(partner._id);
      setMessages(r.data);
      setConversations((prev) =>
        prev.map((c) => c.partner._id === partner._id ? { ...c, unread: 0 } : c)
      );
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  /* ── scroll to bottom on new messages ── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── send ── */
  const sendMessage = () => {
    if (!text.trim() || !activePartner) return;
    getSocket().emit("message:send", { receiverId: activePartner._id, text: text.trim() });
    setText("");
    if (typingTimer.current) clearTimeout(typingTimer.current);
    getSocket().emit("typing:stop", activePartner._id);
  };

  /* ── typing indicator ── */
  const handleTyping = (val: string) => {
    setText(val);
    if (!activePartner) return;
    getSocket().emit("typing:start", activePartner._id);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      getSocket().emit("typing:stop", activePartner._id);
    }, 1500);
  };

  /* ── merge conversations + following into one sidebar list ── */
  const conversationPartnerIds = new Set(conversations.map((c) => c.partner._id));
  const newChats = following.filter((f) => !conversationPartnerIds.has(f._id));

  if (!me) return null;

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden bg-white">

      {/* ── Sidebar: conversation list ── */}
      <div className={`${showSidebar ? "flex" : "hidden"} lg:flex flex-col w-full lg:w-80 shrink-0 border-r border-gray-100`}>
        <div className="px-4 py-4 border-b border-gray-100">
          <p className="text-lg font-bold text-gray-900">Messages</p>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Existing conversations */}
          {conversations.map((c) => (
            <button key={c.partner._id} onClick={() => openChat(c.partner)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left ${activePartner?._id === c.partner._id ? "bg-purple-50" : ""}`}>
              <Avatar user={c.partner} online={onlineIds.has(c.partner._id)} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800 truncate">{c.partner.name}</p>
                  {c.unread > 0 && (
                    <span className="ml-2 shrink-0 bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c.unread}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate">{c.lastMessage?.text}</p>
              </div>
            </button>
          ))}

          {/* Following not yet messaged */}
          {newChats.length > 0 && (
            <>
              <p className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Following</p>
              {newChats.map((f) => (
                <button key={f._id} onClick={() => openChat(f)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left ${activePartner?._id === f._id ? "bg-purple-50" : ""}`}>
                  <Avatar user={f} online={onlineIds.has(f._id)} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{f.name}</p>
                    <p className="text-xs text-gray-400">@{f.username}</p>
                  </div>
                </button>
              ))}
            </>
          )}

          {conversations.length === 0 && newChats.length === 0 && (
            <div className="text-center py-16 px-4">
              <p className="text-3xl mb-2">💬</p>
              <p className="text-gray-400 text-sm">Follow someone to start messaging.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat panel ── */}
      <div className={`${!showSidebar ? "flex" : "hidden"} lg:flex flex-col flex-1 min-w-0`}>
        {activePartner ? (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white">
              <button className="lg:hidden text-gray-400 hover:text-gray-600 mr-1" onClick={() => setShowSidebar(true)}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <Avatar user={activePartner} online={onlineIds.has(activePartner._id)} />
              <div>
                <p className="text-sm font-bold text-gray-900">{activePartner.name}</p>
                <p className="text-xs text-gray-400">
                  {typingFrom.has(activePartner._id)
                    ? <span className="text-purple-500 animate-pulse">typing...</span>
                    : onlineIds.has(activePartner._id) ? "Online" : "Offline"
                  }
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gray-50">
              {loadingHistory ? (
                <div className="flex justify-center pt-10">
                  <p className="text-purple-400 text-sm animate-pulse">Loading...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center pt-10">
                  <p className="text-gray-400 text-sm">No messages yet. Say hi! 👋</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender === me._id;
                  return (
                    <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[70%] px-4 py-2 rounded-2xl text-sm ${
                        isMine
                          ? "bg-gradient-to-r from-purple-600 to-violet-500 text-white rounded-br-sm"
                          : "bg-white text-gray-800 shadow-sm rounded-bl-sm"
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[10px] mt-0.5 ${isMine ? "text-purple-200" : "text-gray-400"} text-right`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
              <input
                value={text}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message..."
                className="flex-1 bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-purple-300"
              />
              <button onClick={sendMessage} disabled={!text.trim()}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 text-white flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <p className="text-5xl mb-3">💬</p>
              <p className="text-gray-500 font-semibold">Select a conversation</p>
              <p className="text-gray-400 text-sm mt-1">Choose from your following list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
