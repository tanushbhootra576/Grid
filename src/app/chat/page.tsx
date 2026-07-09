"use client";

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import {
  IconSend, IconTrash, IconRefresh, IconMoodSmile, IconArrowBackUp, IconX,
  IconSticker, IconThumbUp, IconHeart, IconMoodHappy, IconMoodSurprised,
  IconMoodSad, IconFlame, IconSearch, IconArrowDown, IconHash, IconBuilding,
  IconCalendar, IconMessage, IconUserPlus, IconBan, IconDotsVertical,
  IconArrowLeft, IconEye, IconPinned, IconPinnedOff, IconStarFilled,
  IconBell, IconBellRinging
} from "@tabler/icons-react";
import { showError, showSuccess, showInfo } from "@/lib/error-handling";
import { getAuthHeaders } from "@/lib/api";
import g from "../grid.module.css";

interface Reaction { userId: string; emoji: string; }
interface Message {
  _id: string; content: string; senderId: string; senderName: string;
  type: "universal" | "branch" | "year" | "dm" | "blind"; branch?: string; year?: number;
  createdAt: string; replyTo?: { _id: string; content: string; senderName: string; };
  reactions: Reaction[]; sticker?: string;
}
interface ConversationSummary {
  _id: string; publicId?: string; name: string; photoURL?: string;
  unreadCount?: number; lastMessagePreview?: string; lastMessageAt?: string; isPinned?: boolean;
}

const REACTION_ICONS: Record<string, any> = {
  "👍": IconThumbUp, "❤️": IconHeart, "😂": IconMoodHappy,
  "😮": IconMoodSurprised, "😢": IconMoodSad, "🔥": IconFlame,
};

const STICKERS = [
  "https://cdn-icons-png.flaticon.com/512/742/742751.png",
  "https://cdn-icons-png.flaticon.com/512/742/742752.png",
  "https://cdn-icons-png.flaticon.com/512/742/742920.png",
  "https://cdn-icons-png.flaticon.com/512/742/742760.png",
  "https://cdn-icons-png.flaticon.com/512/742/742822.png",
  "https://cdn-icons-png.flaticon.com/512/742/742745.png",
];

function ChatPageContent() {
  const { user, profile, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dmRecipientId = searchParams.get("dm");
  const [activeTab, setActiveTab] = useState<string | null>("universal");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMessagesLoading, setIsMessagesLoading] = useState(false);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const viewport = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [onlineCount, setOnlineCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [dmUser, setDmUser] = useState<{ name: string } | null>(null);
  const [recentDms, setRecentDms] = useState<ConversationSummary[]>([]);
  const [totalDmUnread, setTotalDmUnread] = useState(0);
  
  const dmUnreadSnapshot = useRef<Record<string, number>>({});
  const dmSnapshotReady = useRef(false);
  const messagesHashRef = useRef("");
  const conversationsHashRef = useRef("");
  const messagesRef = useRef<Message[]>([]);
  const recentDmsRef = useRef<ConversationSummary[]>([]);
  const autoScrollRef = useRef(true);
  
  const pinnedCount = useMemo(() => recentDms.filter((dm) => dm.isPinned).length, [recentDms]);

  const [adminBranch, setAdminBranch] = useState<string>("");
  const [adminYear, setAdminYear] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === "admin") {
      setAdminBranch(profile.branch || "");
      setAdminYear(profile.year ? String(profile.year) : null);
    }
  }, [profile?.role, profile?.branch, profile?.year]);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  const [showSidebar, setShowSidebar] = useState(true);
  const [supportsNotifications, setSupportsNotifications] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [windowInFocus, setWindowInFocus] = useState(true);

  useEffect(() => {
    if (profile?.blockedUsers) {
      setBlockedUsers(profile.blockedUsers);
    }
  }, [profile]);

  useEffect(() => {
    dmSnapshotReady.current = false;
    dmUnreadSnapshot.current = {};
  }, [profile?._id]);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { recentDmsRef.current = recentDms; }, [recentDms]);
  useEffect(() => { autoScrollRef.current = autoScroll; }, [autoScroll]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hasSupport = "Notification" in window;
    setSupportsNotifications(hasSupport);

    const storedPref = localStorage.getItem("camp_notifications_enabled");
    if (storedPref !== null) setNotificationsEnabled(storedPref === "true");

    if (hasSupport) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then((perm) => {
          setNotificationPermission(perm);
          if (perm === "granted" && storedPref === null) {
            setNotificationsEnabled(true);
            localStorage.setItem("camp_notifications_enabled", "true");
          }
        });
      }
    }

    const handleFocus = () => setWindowInFocus(true);
    const handleBlur = () => setWindowInFocus(false);
    const handleVisibility = () => { if (typeof document !== "undefined") setWindowInFocus(!document.hidden); };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (!supportsNotifications || typeof Notification === "undefined") {
      showError({ message: "Browser does not support notifications." }, "Notifications");
      return;
    }

    if (notificationPermission !== "granted") {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        if (permission === "granted") {
          setNotificationsEnabled(true);
          localStorage.setItem("camp_notifications_enabled", "true");
          showSuccess("Notifications enabled");
        } else {
          setNotificationsEnabled(false);
          localStorage.setItem("camp_notifications_enabled", "false");
          showError({ message: "Notification permission denied." }, "Notifications");
        }
      } catch (error) { showError(error, "Notifications"); }
    } else {
      const newState = !notificationsEnabled;
      setNotificationsEnabled(newState);
      localStorage.setItem("camp_notifications_enabled", String(newState));
      showInfo(newState ? "Notifications enabled" : "Notifications disabled");
    }
  }, [supportsNotifications, notificationPermission, notificationsEnabled]);

  const sendBrowserNotification = useCallback((senderName: string, preview?: string) => {
    if (!supportsNotifications || typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") return;
    if (!notificationsEnabled) return;
    const body = preview?.trim()?.slice(0, 120) || "New message";
    try {
      new Notification(`${senderName} sent a message`, { body, icon: "/favicon.ico", tag: `dm-${senderName}` });
    } catch (error) { console.warn("Failed to show browser notification", error); }
  }, [supportsNotifications, notificationsEnabled]);

  const handleSearchUsers = async (query: string) => {
    setUserSearchQuery(query);
    if (query.length < 2) { setSearchResults([]); return; }
    try {
      const res = await fetch(`/api/users?search=${query}&limit=5`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.users) setSearchResults(data.users);
    } catch (error) { console.error(error); }
  };

  const startDm = (userId: string) => {
    setSearchModalOpen(false);
    router.push(`/chat?dm=${userId}`);
  };

  const handleBlockUser = async () => {
    if (!dmRecipientId || !profile) return;
    const isBlocked = blockedUsers.includes(dmRecipientId);
    const action = isBlocked ? "unblock" : "block";

    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
      const res = await fetch("/api/users/block", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile._id, targetUserId: dmRecipientId, action }),
      });
      const data = await res.json();
      if (data.success) {
        setBlockedUsers(data.blockedUsers);
        refreshProfile();
        showSuccess(`User ${action}ed successfully`);
      }
    } catch (error) { showError(error, "Block Failed"); }
  };

  const fetchConversations = useCallback(async (options?: { showSpinner?: boolean }) => {
    if (!profile?._id) return;
    const shouldShowSpinner = options?.showSpinner || recentDmsRef.current.length === 0;
    if (shouldShowSpinner) setIsConversationsLoading(true);
    try {
      const res = await fetch(`/api/chat?type=conversations&userId=${profile._id}`, { headers: getAuthHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setTotalDmUnread(data.totalUnread || 0);
      const incoming = Array.isArray(data.conversations) ? data.conversations : [];
      const hash = incoming.map((dm: any) => `${dm._id}:${dm.unreadCount ?? 0}:${dm.lastMessageAt ?? ""}:${dm.isPinned ? 1 : 0}`).join("|");
      if (conversationsHashRef.current === hash) return;
      conversationsHashRef.current = hash;
      setRecentDms(incoming);
    } catch (error) { console.error(error); } finally {
      if (shouldShowSpinner) setIsConversationsLoading(false);
    }
  }, [profile?._id]);

  useEffect(() => {
    if (!profile?._id) return;
    fetchConversations({ showSpinner: true });
    const interval = setInterval(() => fetchConversations(), 5000);
    return () => clearInterval(interval);
  }, [profile?._id, fetchConversations]);

  const handleConversationAction = useCallback(async (targetId: string, action: "pin" | "unpin" | "delete") => {
    if (!profile?._id) return;
    if (action === "pin" && pinnedCount >= 3) { showError({ message: "You can pin up to 3 conversations." }, "Pin Limit"); return; }
    if (action === "delete" && !confirm("Delete this conversation for both participants?")) return;

    try {
      const res = await fetch("/api/chat/preferences", {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile._id, targetId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update conversation");
      showSuccess(data.message || "Conversation updated");
      await fetchConversations({ showSpinner: true });
      if (action === "delete" && dmRecipientId === targetId) {
        router.push("/chat");
        setActiveTab("universal");
        setMessages([]);
        setDmUser(null);
      }
    } catch (error) { showError(error, "Action Failed"); }
  }, [profile?._id, pinnedCount, fetchConversations, dmRecipientId, router]);

  useEffect(() => {
    if (dmRecipientId) {
      setActiveTab("dm");
      if (window.innerWidth <= 768) setShowSidebar(false);
      (async () => {
        try {
          const res = await fetch(`/api/users/${dmRecipientId}`, { headers: getAuthHeaders() });
          const data = await res.json();
          if (data.user) setDmUser(data.user);
        } catch (e) {}
      })();
    }
  }, [dmRecipientId]);

  const fetchMessages = useCallback(async (options?: { showSpinner?: boolean }) => {
    if (!activeTab) return;
    const type = activeTab;
    const branch = profile?.role === "admin" ? adminBranch : profile?.branch;
    const year = profile?.role === "admin" ? adminYear : profile?.year;

    if (type === "branch" && !branch) return;
    if (type === "year" && !year) return;
    if (type === "dm" && !dmRecipientId) return;

    const shouldShowSpinner = options?.showSpinner || messagesRef.current.length === 0;
    if (shouldShowSpinner) setIsMessagesLoading(true);

    try {
      const query = new URLSearchParams({ type });
      if (type === "branch") if (branch) query.append("branch", branch);
      if (type === "year") if (year) query.append("year", String(year));
      if (type === "dm" && dmRecipientId) query.append("recipientId", dmRecipientId);
      if (profile?._id) query.append("userId", String(profile._id));

      const res = await fetch(`/api/chat?${query.toString()}`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (res.ok) {
        setOnlineCount(data.onlineCount || 0);
        const incomingMessages: Message[] = data.messages || [];
        const payloadHash = incomingMessages.map((msg: Message) => `${msg._id}:${msg.createdAt}`).join("|");
        if (messagesHashRef.current === payloadHash && messagesRef.current.length === incomingMessages.length) return;
        messagesHashRef.current = payloadHash;

        const prev = messagesRef.current;
        const shouldScroll = incomingMessages.length > prev.length && autoScrollRef.current;

        if (prev.length > 0 && incomingMessages.length > prev.length) {
          const newMsgs = incomingMessages.slice(prev.length);
          const lastMsg = newMsgs[newMsgs.length - 1];
          if (lastMsg.senderId !== String(profile?._id)) {
            const isHidden = typeof document !== "undefined" && document.hidden;
            if (!windowInFocus || isHidden) sendBrowserNotification(lastMsg.senderName, lastMsg.content);
          }
        }
        setMessages(incomingMessages);
        if (shouldScroll) requestAnimationFrame(() => scrollToBottom());
      }
    } catch (error) {} finally {
      if (shouldShowSpinner) setIsMessagesLoading(false);
    }
  }, [activeTab, profile?.branch, profile?.year, dmRecipientId, profile?._id, profile?.role, adminBranch, adminYear, sendBrowserNotification, windowInFocus]);

  const scrollToBottom = () => {
    if (viewport.current) {
      viewport.current.scrollTo({ top: viewport.current.scrollHeight, behavior: "smooth" });
      setShowScrollButton(false);
    }
  };

  const onScrollPositionChange = (e: any) => {
    const el = e.target;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setAutoScroll(isAtBottom);
    setShowScrollButton(!isAtBottom);
  };

  const filteredMessages = messages.filter((msg) =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase()) || msg.senderName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (!user) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [user, fetchMessages]);

  useEffect(() => {
    setAutoScroll(true);
    scrollToBottom();
    fetchMessages({ showSpinner: true });
  }, [activeTab, fetchMessages]);

  useEffect(() => {
    if (recentDms.length === 0) {
      dmUnreadSnapshot.current = {};
      dmSnapshotReady.current = false;
      return;
    }
    if (!dmSnapshotReady.current) {
      dmUnreadSnapshot.current = recentDms.reduce<Record<string, number>>((acc, dm) => { acc[dm._id] = dm.unreadCount || 0; return acc; }, {});
      dmSnapshotReady.current = true;
      return;
    }
    const nextSnapshot: Record<string, number> = {};
    const isDocumentHidden = typeof document !== "undefined" ? document.hidden : false;
    recentDms.forEach((dm) => {
      const current = dm.unreadCount || 0;
      const previous = dmUnreadSnapshot.current[dm._id] || 0;
      if (current > previous) {
        const conversationActive = activeTab === "dm" && dmRecipientId === dm._id;
        if (!conversationActive) showInfo(`${dm.name} sent ${current - previous} new message(s)`);
        if (!conversationActive || !windowInFocus || isDocumentHidden) sendBrowserNotification(dm.name, dm.lastMessagePreview);
      }
      nextSnapshot[dm._id] = current;
    });
    dmUnreadSnapshot.current = nextSnapshot;
  }, [recentDms, activeTab, dmRecipientId, windowInFocus, sendBrowserNotification]);

  const handleSendMessage = async (stickerUrl?: string) => {
    if ((!newMessage.trim() && !stickerUrl) || !user || !profile) return;
    const type = activeTab;
    const branch = profile.role === "admin" ? adminBranch : profile.branch;
    const year = profile.role === "admin" ? adminYear : profile.year;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: newMessage, senderId: profile._id, type,
          branch: type === "branch" ? branch : undefined,
          year: type === "year" ? Number(year) : undefined,
          recipientId: type === "dm" ? dmRecipientId : undefined,
          replyTo: replyingTo ? { _id: replyingTo._id, content: replyingTo.content, senderName: replyingTo.senderName } : undefined,
          sticker: stickerUrl,
        }),
      });
      if (res.ok) {
        setNewMessage(""); setReplyingTo(null); setAutoScroll(true); fetchMessages();
      } else {
        const data = await res.json();
        showError({ message: data.error || "Failed to send message" }, "Message Failed");
      }
    } catch (error) { showError(error, "Message Failed"); }
  };

  const handleReaction = async (msgId: string, emoji: string) => {
    if (!profile) return;
    try {
      const res = await fetch(`/api/chat/${msgId}`, { method: "PATCH", headers: getAuthHeaders(), body: JSON.stringify({ action: "react", userId: profile._id, emoji }) });
      if (res.ok) fetchMessages();
    } catch (error) {}
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm("Delete this message?")) return;
    try {
      const res = await fetch(`/api/chat/${msgId}?userId=${profile?._id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) fetchMessages();
    } catch (error) {}
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className={g.container} style={{ textAlign: 'center', marginTop: 100 }}>
          <p>Please log in to access chat.</p>
        </div>
      </>
    );
  }


  return (
    <>
      <Navbar />
      <div style={{ display: 'flex', height: 'calc(100vh - 80px)', background: 'var(--bg)', borderTop: '1px solid var(--border)' }}>
        
        {/* Sidebar */}
        <div style={{ width: showSidebar ? 320 : 0, transition: 'width 0.3s', borderRight: '1px solid var(--border)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-space)', fontSize: '1rem', marginBottom: 16 }}>Channels</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button className={g.btn} style={{ justifyContent: 'flex-start', background: activeTab === 'universal' ? 'var(--accent)' : 'transparent', color: activeTab === 'universal' ? '#fff' : 'var(--text)', border: 'none' }} onClick={() => setActiveTab('universal')}>
                <IconHash size={16} /> Universal
              </button>
              <button className={g.btn} style={{ justifyContent: 'flex-start', background: activeTab === 'branch' ? 'var(--accent)' : 'transparent', color: activeTab === 'branch' ? '#fff' : 'var(--text)', border: 'none' }} onClick={() => setActiveTab('branch')} disabled={!profile?.branch && profile?.role !== 'admin'}>
                <IconBuilding size={16} /> {profile?.role === 'admin' ? adminBranch || 'Branch (Admin)' : profile?.branch || 'Branch'}
              </button>
              <button className={g.btn} style={{ justifyContent: 'flex-start', background: activeTab === 'year' ? 'var(--accent)' : 'transparent', color: activeTab === 'year' ? '#fff' : 'var(--text)', border: 'none' }} onClick={() => setActiveTab('year')} disabled={!profile?.year && profile?.role !== 'admin'}>
                <IconCalendar size={16} /> {profile?.role === 'admin' ? (adminYear ? `Year ${adminYear} (Admin)` : 'Year (Admin)') : (profile?.year ? `Year ${profile.year}` : 'Year')}
              </button>
              <button className={g.btn} style={{ justifyContent: 'flex-start', background: activeTab === 'blind' ? 'var(--accent)' : 'transparent', color: activeTab === 'blind' ? '#fff' : 'var(--text)', border: 'none' }} onClick={() => setActiveTab('blind')}>
                <IconEye size={16} /> Anonymous / Blind
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, marginBottom: 16 }}>
              <h3 style={{ fontFamily: 'var(--font-space)', fontSize: '1rem', margin: 0 }}>Direct Messages</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={g.btn} style={{ padding: 4, border: 'none' }} onClick={() => setSearchModalOpen(true)}>
                  <IconUserPlus size={16} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto' }}>
              {recentDms.map(dm => {
                const isActive = activeTab === 'dm' && dmRecipientId === dm._id;
                return (
                  <button key={dm._id} className={g.btn} style={{ justifyContent: 'space-between', background: isActive ? 'var(--accent-2)' : 'transparent', color: 'var(--text)', border: 'none', padding: '8px 12px' }} onClick={() => router.push(`/chat?dm=${dm._id}`)}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>{dm.name?.[0]}</div>
                      <span style={{ fontWeight: isActive ? 'bold' : 'normal' }}>{dm.name}</span>
                    </div>
                    {(dm.unreadCount ?? 0) > 0 && <span className={g.badge} style={{ background: 'red', color: 'white', padding: '2px 6px', fontSize: '0.7rem' }}>{dm.unreadCount}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Header */}
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-2)' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {!showSidebar && <button className={g.btn} style={{ padding: 4, border: 'none' }} onClick={() => setShowSidebar(true)}><IconArrowLeft size={20} /></button>}
              <h2 style={{ fontFamily: 'var(--font-space)', fontSize: '1.2rem', margin: 0 }}>
                {activeTab === 'universal' && '# Universal Chat'}
                {activeTab === 'branch' && `# ${profile?.branch} Chat`}
                {activeTab === 'year' && `# Year ${profile?.year} Chat`}
                {activeTab === 'blind' && `# Blind Insights`}
                {activeTab === 'dm' && `@ ${dmUser?.name || 'User'}`}
              </h2>
              {activeTab !== 'dm' && <span className={g.badge} style={{ background: 'var(--bg-3)', color: 'var(--text)' }}>{onlineCount} Online</span>}
            </div>
            <input className={g.input} style={{ width: 200, padding: '6px 12px', border: '1px solid var(--border)' }} placeholder="Search messages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', position: 'relative' }} ref={viewport} onScroll={onScrollPositionChange}>
            {isMessagesLoading && messages.length === 0 ? <div className={g.spinner} style={{ margin: 'auto' }} /> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredMessages.map(msg => {
                  const isMe = msg.senderId === String(profile?._id);
                  return (
                    <div key={msg._id} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                      {!isMe && <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>{msg.senderName === 'Anonymous' ? <IconEye size={16} /> : msg.senderName?.[0]}</div>}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        {!isMe && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, marginLeft: 4 }}>{msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                        {isMe && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, marginRight: 4 }}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                        
                        {msg.replyTo && (
                          <div style={{ fontSize: '0.8rem', background: 'var(--bg-3)', padding: '6px 10px', borderRadius: 4, marginBottom: 4, borderLeft: '3px solid var(--accent)', color: 'var(--text-muted)' }}>
                            <strong style={{ color: 'var(--text)' }}>{msg.replyTo.senderName}</strong>: {msg.replyTo.content.substring(0, 40)}...
                          </div>
                        )}
                        
                        {msg.sticker ? (
                          <img src={msg.sticker} alt="sticker" style={{ width: 120, height: 120, objectFit: 'contain' }} />
                        ) : (
                          <div style={{ 
                            padding: '10px 16px', 
                            background: isMe ? 'var(--accent)' : 'var(--bg-2)', 
                            color: isMe ? '#fff' : 'var(--text)', 
                            border: isMe ? 'none' : '1px solid var(--border)',
                            borderBottomRightRadius: isMe ? 0 : 16,
                            borderBottomLeftRadius: !isMe ? 0 : 16,
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16,
                            fontSize: '0.95rem',
                            lineHeight: 1.4
                          }}>
                            {msg.content}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                          {msg.reactions?.length > 0 && Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                            <span key={emoji} className={g.badge} style={{ cursor: 'pointer', background: 'var(--bg-3)', padding: '2px 6px', fontSize: '0.75rem', border: '1px solid var(--border)' }} onClick={() => handleReaction(msg._id, emoji)}>
                              {emoji} {msg.reactions.filter(r => r.emoji === emoji).length}
                            </span>
                          ))}
                          <button className={g.btn} style={{ padding: 2, border: 'none', background: 'transparent' }} onClick={() => setReplyingTo(msg)}><IconArrowBackUp size={14} /></button>
                          {(isMe || profile?.role === 'admin') && <button className={g.btn} style={{ padding: 2, border: 'none', background: 'transparent' }} onClick={() => handleDeleteMessage(msg._id)}><IconTrash size={14} /></button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {showScrollButton && (
              <button className={`${g.btn} ${g.btnPrimary}`} style={{ position: 'absolute', bottom: 24, right: 24, borderRadius: '50%', width: 48, height: 48, padding: 0, justifyContent: 'center' }} onClick={scrollToBottom}>
                <IconArrowDown size={20} />
              </button>
            )}
          </div>

          {/* Input Area */}
          <div style={{ padding: 24, borderTop: '1px solid var(--border)', background: 'var(--bg-2)' }}>
            {replyingTo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-3)', padding: '8px 16px', borderLeft: '4px solid var(--accent)', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>Replying to {replyingTo.senderName}</div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{replyingTo.content.substring(0, 60)}</div>
                </div>
                <button className={g.btn} style={{ padding: 4, border: 'none' }} onClick={() => setReplyingTo(null)}><IconX size={16} /></button>
              </div>
            )}
            
            <div style={{ display: 'flex', gap: 12 }}>
              <input 
                className={g.input} 
                style={{ flex: 1, border: '1px solid var(--border)', fontSize: '1rem', padding: '12px 16px' }} 
                placeholder="Type a message..." 
                value={newMessage} 
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button className={`${g.btn} ${g.btnPrimary}`} style={{ padding: '0 24px' }} onClick={() => handleSendMessage()} disabled={!newMessage.trim()}>
                <IconSend size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New DM Search Modal */}
      {searchModalOpen && (
        <div className={g.modalBackdrop}>
          <div className={g.modal} style={{ maxWidth: 500 }}>
            <div className={g.modalHeader}>
              <h2 className={g.modalTitle}>New Message</h2>
              <button className={g.closeBtn} onClick={() => setSearchModalOpen(false)}><IconX size={24} /></button>
            </div>
            <div className={g.modalBody}>
              <input className={g.input} style={{ width: '100%', marginBottom: 16, border: '1px solid var(--border)' }} placeholder="Search users by name..." value={userSearchQuery} onChange={e => handleSearchUsers(e.target.value)} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {searchResults.map(u => (
                  <div key={u._id} className={g.card} style={{ height: 'auto', padding: 12, cursor: 'pointer', border: '1px solid var(--border)' }} onClick={() => startDm(u._id)}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{u.name[0]}</div>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{u.branch} • Year {u.year}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {userSearchQuery.length >= 2 && searchResults.length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>No users found</div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageContent />
    </Suspense>
  );
}
