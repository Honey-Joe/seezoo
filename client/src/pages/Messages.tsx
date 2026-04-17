import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "../store";
import { listenConversations, listenMessages, sendMessage, markRead } from "../services/messageService";
import { searchUsers, getUserById } from "../services/userService";
import type { IConversation, IDirectMessage, IPublicUser } from "../types";

function timeAgo(ts: number) {
  if (!ts) return "";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const Messages = () => {
  const me = useAppSelector((s) => s.auth.user)!;

  const [convos,       setConvos]       = useState<IConversation[]>([]);
  const [activeId,     setActiveId]     = useState<string | null>(null);
  const [activeUser,   setActiveUser]   = useState<{ id: string; name: string; username: string; image?: string } | null>(null);
  const [messages,     setMessages]     = useState<IDirectMessage[]>([]);
  const [text,         setText]         = useState("");
  const [sending,      setSending]      = useState(false);
  const [searchQ,      setSearchQ]      = useState("");
  const [searchRes,    setSearchRes]    = useState<IPublicUser[]>([]);
  const [searching,    setSearching]    = useState(false);
  const [showSearch,   setShowSearch]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* listen to conversation list */
  useEffect(() => {
    const unsub = listenConversations(me._id, setConvos);
    return unsub;
  }, [me._id]);

  /* listen to active chat messages */
  useEffect(() => {
    if (!activeId) return;
    setMessages([]); // clear previous chat messages
    const unsub = listenMessages(me._id, activeId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    });
    markRead(me._id, activeId);
    return unsub;
  }, [activeId, me._id]);

  /* debounced user search */
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchQ.trim()) { setSearchRes([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try { const r = await searchUsers(searchQ); setSearchRes(r.data); }
      catch { setSearchRes([]); }
      finally { setSearching(false); }
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQ]);

  // When opening from conversation list, partnerName may be missing in old RTDB nodes
  // so we fetch the user profile by ID via username lookup as fallback
  const openChatFromConvo = async (c: IConversation) => {
    if (c.partnerName && c.partnerUsername) {
      openChat(c.partnerId, c.partnerName, c.partnerUsername, c.partnerImage);
      return;
    }
    // partnerName missing in old RTDB nodes — fetch from API
    setActiveId(c.partnerId);
    setActiveUser({ id: c.partnerId, name: "...", username: "...", image: undefined });
    setShowSearch(false);
    try {
      const res = await getUserById(c.partnerId);
      const u = res.data;
      setActiveUser({ id: u._id, name: u.name, username: u.username, image: u.profileImage });
    } catch { /* silent */ }
  };

  const openChat = (id: string, name: string, username: string, image?: string) => {
    setActiveId(id);
    setActiveUser({ id, name, username, image });
    setShowSearch(false);
    setSearchQ("");
    setSearchRes([]);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !activeId || !activeUser || sending) return;
    setSending(true);
    try {
      await sendMessage(
        me._id, activeId, text.trim(),
        me.name, me.username, me.profileImage,
        activeUser.name, activeUser.username, activeUser.image,
      );
      setText("");
    } finally { setSending(false); }
  };

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden">

      {/* ── Sidebar: conversation list ── */}
      <div className={`w-full lg:w-80 shrink-0 border-r border-purple-100 bg-white flex flex-col ${activeId ? "hidden lg:flex" : "flex"}`}>

        {/* Header */}
        <div className="px-4 py-4 border-b border-purple-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">Messages</h2>
            <button onClick={() => setShowSearch((v) => !v)}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-600 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {/* New chat search */}
          {showSearch && (
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input value={searchQ} onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search users..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                autoFocus
              />
              {searching && (
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
              {searchRes.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-purple-100 rounded-xl shadow-lg z-10 overflow-hidden">
                  {searchRes.map((u) => (
                    <button key={u._id} onClick={() => openChat(u._id, u.name, u.username, u.profileImage)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-purple-50 transition-colors text-left">
                      <div className="w-8 h-8 rounded-full overflow-hidden  from-purple-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.profileImage ? <img src={u.profileImage} alt="" className="w-full h-full object-cover" /> : u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                        <p className="text-xs text-gray-400">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {convos.length === 0 && (
            <div className="text-center py-16 px-4">
              <p className="text-3xl mb-3">💬</p>
              <p className="text-gray-500 text-sm font-semibold mb-1">No messages yet</p>
              <p className="text-gray-400 text-xs">Click + to start a conversation</p>
            </div>
          )}
          {convos.map((c) => (
            <button key={c.partnerId}
              onClick={() => openChatFromConvo(c)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors text-left border-b border-gray-50 ${activeId === c.partnerId ? "bg-purple-50" : ""}`}>
              <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {c.partnerImage ? <img src={c.partnerImage} alt="" className="w-full h-full object-cover" /> : (c.partnerName ?? "?").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900 truncate">{c.partnerName}</p>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">{timeAgo(c.lastAt)}</span>
                </div>
                <p className="text-xs text-gray-400 truncate">{c.lastMessage}</p>
              </div>
              {c.unread > 0 && (
                <span className="shrink-0 w-5 h-5 bg-purple-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {c.unread > 9 ? "9+" : c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat window ── */}
      <div className={`flex-1 flex flex-col ${!activeId ? "hidden lg:flex" : "flex"}`}>
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-5xl mb-4">💬</p>
              <p className="text-gray-500 font-semibold mb-1">Select a conversation</p>
              <p className="text-gray-400 text-sm">or start a new one with +</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-purple-100 bg-white">
              <button onClick={() => setActiveId(null)}
                className="lg:hidden text-gray-400 hover:text-gray-600 mr-1">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-purple-400 to-violet-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {activeUser?.image
                  ? <img src={activeUser.image} alt="" className="w-full h-full object-cover" />
                  : (activeUser?.name ?? "?").charAt(0).toUpperCase()
                }
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{activeUser?.name}</p>
                <p className="text-xs text-gray-400">@{activeUser?.username}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gradient-to-b from-purple-50/30 to-white">
              {messages.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">👋</p>
                  <p className="text-gray-400 text-sm">Say hello to {activeUser?.name}!</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMine = msg.senderId === me._id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? "bg-gradient-to-r from-purple-600 to-violet-500 text-white rounded-br-sm"
                        : "bg-white border border-purple-100 text-gray-800 rounded-bl-sm shadow-sm"
                    }`}>
                      <p>{msg.text} </p>
                      <p className={`text-[10px] mt-1 ${isMine ? "text-purple-200" : "text-gray-400"}`}>
                        {msg.createdAt ? timeAgo(msg.createdAt) : ""}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend}
              className="flex items-center gap-3 px-4 py-3 border-t border-purple-100 bg-white">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all"
              />
              <button type="submit" disabled={!text.trim() || sending}
                className="w-10 h-10 bg-gradient-to-r from-purple-600 to-violet-500 text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all shadow-sm shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default Messages;
