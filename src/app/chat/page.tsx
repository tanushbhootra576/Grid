"use client";

import { useState, useEffect, useRef, Suspense, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/components/AuthProvider";
import {
  IconSend, IconTrash, IconRefresh, IconMoodSmile, IconArrowBackUp, IconX,
  IconSticker, IconThumbUp, IconHeart, IconMoodHappy, IconMoodSurprised,
  IconMoodSad, IconFlame, IconSearch, IconArrowDown, IconHash, IconBuilding,
  IconMenu2,
  IconCalendar, IconMessage, IconUserPlus, IconBan, IconDotsVertical,
  IconArrowLeft, IconEye, IconPinned, IconPinnedOff, IconStarFilled,
  IconBell, IconBellRinging, IconShieldCheck
} from "@tabler/icons-react";
import { showError, showSuccess, showInfo } from "@/lib/error-handling";
import { getAuthHeaders } from "@/lib/api";
import g from "../grid.module.css";
import c from "./chat.module.css";

interface Reaction { userId: string; emoji: string; }
interface Message {
  _id: string; content: string; senderId: string; senderName: string;
  type: "universal" | "year" | "dm" | "blind"; year?: number;
  createdAt: string; replyTo?: { _id: string; content: string; senderName: string; };
  reactions: Reaction[]; sticker?: string;
  senderVerified?: boolean;
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
  
  const [stickerPanelOpen, setStickerPanelOpen] = useState(false);
  
  const dmUnreadSnapshot = useRef<Record<string, number>>({});
  const dmSnapshotReady = useRef(false);
  const messagesHashRef = useRef("");
  const conversationsHashRef = useRef("");
  const messagesRef = useRef<Message[]>([]);
  const recentDmsRef = useRef<ConversationSummary[]>([]);
  const autoScrollRef = useRef(true);
  
  const pinnedCount = useMemo(() => recentDms.filter((dm) => dm.isPinned).length, [recentDms]);

  const [adminYear, setAdminYear] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role === "admin") {
      setAdminYear(profile.year ? String(profile.year) : null);
    }
  }, [profile?.role, profile?.year]);

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  
  const [contextMenuMsg, setContextMenuMsg] = useState<string | null>(null);
  const [contextMenuDm, setContextMenuDm] = useState<string | null>(null);

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

    setContextMenuDm(null);

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
    const year = profile?.role === "admin" ? adminYear : profile?.year;

    if (type === "year" && !year) return;
    if (type === "dm" && !dmRecipientId) return;

    const shouldShowSpinner = options?.showSpinner || messagesRef.current.length === 0;
    if (shouldShowSpinner) setIsMessagesLoading(true);

    try {
      const query = new URLSearchParams({ type });
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
  }, [activeTab, profile?.year, dmRecipientId, profile?._id, profile?.role, adminYear, sendBrowserNotification, windowInFocus]);

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
    const year = profile.role === "admin" ? adminYear : profile.year;
    
    setStickerPanelOpen(false);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          content: newMessage, senderId: profile._id, type,
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
    setContextMenuMsg(null);
    try {
      const res = await fetch(`/api/chat/${msgId}?userId=${profile?._id}`, { method: "DELETE", headers: getAuthHeaders() });
      if (res.ok) fetchMessages();
    } catch (error) {}
  };
  
  const isBlockedUser = dmRecipientId && blockedUsers.includes(dmRecipientId);

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
      <div className={c.chatWrap}>
        
        {/* Mobile Sidebar Overlay */}
        <div 
          className={`${c.sidebarOverlay} ${showSidebar ? c.sidebarOverlayActive : ''}`}
          onClick={() => setShowSidebar(false)}
        />
        
        {/* Sidebar */}
        <div className={`${c.sidebar} ${!showSidebar ? c.sidebarHidden : ''}`}>
          <div className={c.sidebarTop}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className={c.sidebarTitle}>Channels</div>
              <button className={`${c.iconBtn} ${c.closeSidebarBtn}`} onClick={() => setShowSidebar(false)}>
                <IconX size={16} />
              </button>
            </div>
            <div className={c.channelList}>
              <button className={`${c.channelBtn} ${activeTab === 'universal' ? c.channelBtnActive : ''}`} onClick={() => setActiveTab('universal')}>
                <IconHash size={18} className={c.channelIcon} /> Universal
              </button>
              <button 
                className={`${c.channelBtn} ${activeTab === 'year' ? c.channelBtnActive : ''}`} 
                onClick={() => setActiveTab('year')} 
                disabled={!profile?.year && profile?.role !== 'admin'}
                style={{ opacity: (!profile?.year && profile?.role !== 'admin') ? 0.5 : 1 }}
              >
                <IconCalendar size={18} className={c.channelIcon} /> 
                {profile?.role === 'admin' ? (adminYear ? `Year ${adminYear} (Admin)` : 'Year (Admin)') : (profile?.year ? `Year ${profile.year}` : 'Year')}
              </button>
              <button className={`${c.channelBtn} ${activeTab === 'blind' ? c.channelBtnActive : ''}`} onClick={() => setActiveTab('blind')}>
                <IconEye size={18} className={c.channelIcon} /> Blind Insights
              </button>
            </div>
          </div>
          
          <div className={c.dmSection}>
            <div className={c.dmSectionHeader}>
              <div className={c.dmSectionTitle}>Direct Messages</div>
              <button className={c.iconBtn} onClick={() => setSearchModalOpen(true)}>
                <IconUserPlus size={16} />
              </button>
            </div>
            
            <div className={c.dmList}>
              {recentDms.map(dm => {
                const isActive = activeTab === 'dm' && dmRecipientId === dm._id;
                return (
                  <div key={dm._id} style={{ position: 'relative' }}>
                    <button 
                      className={`${c.dmItem} ${isActive ? c.dmItemActive : ''}`} 
                      onClick={() => router.push(`/chat?dm=${dm._id}`)}
                    >
                      <div className={`${c.dmAvatar} ${dm.isPinned ? c.dmAvatarPinned : ''}`}>
                        {dm.name?.[0]?.toUpperCase()}
                      </div>
                      <div className={c.dmInfo}>
                        <div className={c.dmName}>{dm.name}</div>
                        <div className={c.dmPreview}>{dm.lastMessagePreview || "New conversation"}</div>
                      </div>
                      {(dm.unreadCount ?? 0) > 0 && <div className={c.dmBadge}>{dm.unreadCount}</div>}
                    </button>
                    
                    <button 
                      className={c.iconBtn} 
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', opacity: contextMenuDm === dm._id ? 1 : 0 }}
                      onClick={(e) => { e.stopPropagation(); setContextMenuDm(contextMenuDm === dm._id ? null : dm._id); }}
                    >
                      <IconDotsVertical size={16} />
                    </button>
                    
                    {contextMenuDm === dm._id && (
                      <div className={c.contextMenu} style={{ right: 8, top: '100%', zIndex: 100 }}>
                        <button className={c.contextMenuItem} onClick={() => handleConversationAction(dm._id, dm.isPinned ? "unpin" : "pin")}>
                          {dm.isPinned ? <><IconPinnedOff size={16} /> Unpin</> : <><IconPinned size={16} /> Pin (Max 3)</>}
                        </button>
                        <div className={c.contextMenuDivider} />
                        <button className={`${c.contextMenuItem} ${c.contextMenuDanger}`} onClick={() => handleConversationAction(dm._id, "delete")}>
                          <IconTrash size={16} /> Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Area */}
        <div className={c.main}>
          <div className={c.header}>
            <div className={c.headerLeft}>
              {!showSidebar && (
                <button className={c.iconBtn} onClick={() => setShowSidebar(true)}>
                  <IconMenu2 size={20} />
                </button>
              )}
              <h2 className={c.headerTitle}>
                {activeTab === 'universal' && '# Universal'}
                {activeTab === 'year' && `# Year ${profile?.year || adminYear}`}
                {activeTab === 'blind' && '# Blind Insights'}
                {activeTab === 'dm' && `@ ${dmUser?.name || 'User'}`}
              </h2>
              {activeTab === 'dm' && dmUser && (
                <button 
                  className={c.iconBtn} 
                  title={isBlockedUser ? "Unblock User" : "Block User"} 
                  onClick={handleBlockUser}
                  style={{ color: isBlockedUser ? '#ef4444' : 'var(--text-muted)' }}
                >
                  <IconBan size={18} />
                </button>
              )}
            </div>
            
            <div className={c.headerMeta}>
              {activeTab !== 'dm' && (
                <div className={c.onlinePill}>
                  <div className={c.onlineDot} />
                  {onlineCount} Online
                </div>
              )}
              <button 
                className={c.iconBtn} 
                onClick={toggleNotifications}
                title={notificationsEnabled ? "Disable Notifications" : "Enable Notifications"}
              >
                {notificationsEnabled ? <IconBell size={18} /> : <IconBellRinging size={18} style={{ opacity: 0.5 }} />}
              </button>
              <div className={c.searchBar}>
                <IconSearch size={16} color="var(--text-muted)" />
                <input 
                  className={c.searchInput} 
                  placeholder="Search messages..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className={c.messages} ref={viewport} onScroll={onScrollPositionChange}>
            {isMessagesLoading && messages.length === 0 ? (
              <div className={c.messagesLoading}>
                <div className="squareSpinner" />
                <div>Loading messages...</div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className={c.emptyState}>
                <IconMessage size={48} className={c.emptyIcon} />
                <div className={c.emptyTitle}>No messages yet</div>
                <div>Be the first to say hello!</div>
              </div>
            ) : (
              <>
                {filteredMessages.map((msg, idx) => {
                  const isMe = msg.senderId === String(profile?._id);
                  const isBlind = activeTab === 'blind';
                  const showDateDivider = idx === 0 || new Date(filteredMessages[idx-1].createdAt).toDateString() !== new Date(msg.createdAt).toDateString();
                  
                  return (
                    <div key={msg._id} style={{ display: 'flex', flexDirection: 'column' }}>
                      {showDateDivider && (
                        <div className={c.dayDivider}>
                          <div className={c.dayDividerLine} />
                          {new Date(msg.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          <div className={c.dayDividerLine} />
                        </div>
                      )}
                      
                      <div className={`${c.msgRow} ${isMe ? c.msgRowMe : ''}`}>
                        {!isMe && (
                          <div className={c.msgAvatar}>
                            {isBlind ? <IconEye size={18} /> : msg.senderName?.[0]?.toUpperCase()}
                          </div>
                        )}
                        
                        <div className={c.msgBody}>
                          {!isMe && (
                            <div className={c.msgMeta}>
                              <span className={c.msgSender}>{isBlind ? 'Anonymous' : msg.senderName}</span>
                              {msg.senderVerified && !isBlind && (
                                <IconShieldCheck size={14} className={c.verifiedBadge} title="Verified Student" />
                              )}
                              <span className={c.msgTime}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                          {isMe && (
                            <div className={c.msgMeta}>
                              <span className={c.msgTime}>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          )}
                          
                          {msg.replyTo && (
                            <div className={c.replyQuote}>
                              <div className={c.replyQuoteText}>
                                <strong>{msg.replyTo.senderName}</strong>: {msg.replyTo.content}
                              </div>
                            </div>
                          )}
                          
                          {msg.sticker ? (
                            <img src={msg.sticker} alt="sticker" className={c.sticker} />
                          ) : (
                            <div className={`${c.bubble} ${isMe ? c.bubbleMe : c.bubbleOther} ${isBlind ? c.bubbleBlind : ''}`}>
                              {msg.content}
                            </div>
                          )}
                          
                          {msg.reactions?.length > 0 && (
                            <div className={c.reactions}>
                              {Array.from(new Set(msg.reactions.map(r => r.emoji))).map(emoji => (
                                <button 
                                  key={emoji} 
                                  className={`${c.reactionChip} ${msg.reactions.some(r => r.emoji === emoji && String(r.userId) === String(profile?._id)) ? c.reactionChipActive : ''}`} 
                                  onClick={() => handleReaction(msg._id, emoji)}
                                >
                                  {emoji} {msg.reactions.filter(r => r.emoji === emoji).length}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Hover Actions */}
                        <div className={c.msgActions}>
                          <div className={c.reactionPicker}>
                            {['👍', '❤️', '😂', '😮'].map(emoji => (
                              <button key={emoji} className={c.reactionBtn} onClick={() => handleReaction(msg._id, emoji)}>
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 4px' }} />
                          <button className={c.actionBtn} onClick={() => setReplyingTo(msg)} title="Reply">
                            <IconArrowBackUp size={16} />
                          </button>
                          {(isMe || profile?.role === 'admin') && (
                            <button className={c.actionBtn} onClick={() => handleDeleteMessage(msg._id)} title="Delete">
                              <IconTrash size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            
            {showScrollButton && (
              <button className={c.scrollBtn} onClick={scrollToBottom}>
                <IconArrowDown size={20} />
              </button>
            )}
          </div>

          {isBlockedUser && (
            <div className={c.blockedNotice}>
              <IconBan size={20} />
              You have blocked this user. Messages won't be sent or received.
            </div>
          )}

          {!isBlockedUser && (
            <div className={c.inputArea}>
              {replyingTo && (
                <div className={c.replyBar}>
                  <div className={c.replyBarText}>
                    Replying to <strong>{replyingTo.senderName}</strong>: {replyingTo.content}
                  </div>
                  <button className={c.iconBtn} onClick={() => setReplyingTo(null)}>
                    <IconX size={16} />
                  </button>
                </div>
              )}
              
              <div className={c.inputRow}>
                <textarea 
                  className={c.inputBox}
                  placeholder={activeTab === 'blind' ? "Type an anonymous message..." : "Type a message..."}
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={1}
                />
                
                <div className={c.inputActions}>
                  <div style={{ position: 'relative' }}>
                    <button 
                      className={c.iconBtn} 
                      onClick={() => setStickerPanelOpen(!stickerPanelOpen)}
                      style={{ width: 44, height: 44, borderRadius: '50%', background: stickerPanelOpen ? 'var(--bg-3)' : 'transparent' }}
                    >
                      <IconSticker size={24} />
                    </button>
                    
                    {stickerPanelOpen && (
                      <div className={c.stickerPanel}>
                        {STICKERS.map((sticker, idx) => (
                          <button key={idx} className={c.stickerBtn} onClick={() => handleSendMessage(sticker)}>
                            <img src={sticker} alt="Sticker" className={c.stickerImg} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button 
                    className={c.sendBtn} 
                    onClick={() => handleSendMessage()} 
                    disabled={!newMessage.trim() && !stickerPanelOpen}
                    style={{ borderRadius: '50%' }}
                  >
                    <IconSend size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      {searchModalOpen && (
        <div className={c.modalOverlay} onClick={() => setSearchModalOpen(false)}>
          <div className={c.modal} onClick={e => e.stopPropagation()}>
            <div className={c.modalHeader}>
              <h2 className={c.modalTitle}>New Direct Message</h2>
              <button className={c.iconBtn} onClick={() => setSearchModalOpen(false)}>
                <IconX size={20} />
              </button>
            </div>
            
            <div className={c.modalSearch}>
              <input 
                className={c.modalSearchInput} 
                placeholder="Search users by name..." 
                value={userSearchQuery} 
                onChange={e => handleSearchUsers(e.target.value)} 
                autoFocus
              />
            </div>
            
            <div className={c.modalResults}>
              {searchResults.length > 0 ? (
                searchResults.map(u => (
                  <div key={u._id} className={c.userResult} onClick={() => startDm(u._id)}>
                    <div className={c.userResultAvatar}>
                      {u.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className={c.userResultName}>{u.name}</div>
                      <div className={c.userResultMeta}>
                        Year {u.year}
                      </div>
                    </div>
                  </div>
                ))
              ) : userSearchQuery.length >= 2 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No users found matching "{userSearchQuery}"
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  Type at least 2 characters to search
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="squareSpinner" style={{ margin: '100px auto' }} />}>
      <ChatPageContent />
    </Suspense>
  );
}

