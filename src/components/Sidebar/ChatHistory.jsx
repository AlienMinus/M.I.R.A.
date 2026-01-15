import { useState, useEffect, useRef } from "react";
import { FiMessageSquare } from "react-icons/fi";
import SidebarItem from "./SidebarItem";

export default function ChatHistory({ 
  currentChatId, 
  onSelectChat, 
  onNewChat, 
  setMobileOpen, 
  isCollapsed,
  mobileOpen,
  searchQuery
}) {
  const [savedChats, setSavedChats] = useState([]);
  const activeChatRef = useRef(null);

  useEffect(() => {
    const loadChats = () => {
      const chats = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith("mira-chat-") && !key.startsWith("mira-chat-timestamp-")) {
          const id = parseInt(key.replace("mira-chat-", ""), 10);
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const messages = JSON.parse(stored);
              if (Array.isArray(messages) && messages.length > 0) {
                const firstUserMsg = messages.find((m) => m.role === "user");
                const title = firstUserMsg
                  ? firstUserMsg.text.slice(0, 24) + (firstUserMsg.text.length > 24 ? "..." : "")
                  : "New Chat";
                const timestampStr = localStorage.getItem(`mira-chat-timestamp-${id}`);
                const timestamp = timestampStr ? parseInt(timestampStr, 10) : 0;
                const content = messages.map((m) => m.text || "").join(" ");
                chats.push({ id, title, timestamp, content });
              }
            }
          } catch (e) {
            console.error("Failed to parse chat", key);
          }
        }
      }
      chats.sort((a, b) => b.timestamp - a.timestamp);
      setSavedChats(chats);
    };

    loadChats();
    window.addEventListener("mira-chat-update", loadChats);
    return () => window.removeEventListener("mira-chat-update", loadChats);
  }, [currentChatId, mobileOpen]);

  useEffect(() => {
    if (activeChatRef.current) {
      activeChatRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [currentChatId, savedChats]);

  const handleDeleteChat = (e, chatId) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this chat?")) {
      localStorage.removeItem(`mira-chat-${chatId}`);
      localStorage.removeItem(`mira-chat-timestamp-${chatId}`);
      setSavedChats((prev) => prev.filter((chat) => chat.id !== chatId));
      if (chatId === currentChatId) {
        onNewChat();
      }
    }
  };

  // Group chats by date
  const groupedChats = {
    "Today": [],
    "Yesterday": [],
    "Previous 7 Days": [],
    "Older": []
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const filteredChats = searchQuery
    ? savedChats.filter((chat) => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chat.content && chat.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : savedChats;

  filteredChats.forEach((chat) => {
    const date = new Date(chat.timestamp);
    if (date >= today) groupedChats["Today"].push(chat);
    else if (date >= yesterday) groupedChats["Yesterday"].push(chat);
    else if (date >= sevenDaysAgo) groupedChats["Previous 7 Days"].push(chat);
    else groupedChats["Older"].push(chat);
  });

  const getHighlightedText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedHighlight})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === highlight.toLowerCase() ? (
            <span key={i} style={{ color: "#fbbf24", backgroundColor: "rgba(251, 191, 36, 0.1)" }}>{part}</span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  if (isCollapsed) return null;

  if (searchQuery && filteredChats.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#71717a", fontSize: "0.875rem" }}>
        No chats found
      </div>
    );
  }

  return (
    <>
      {["Today", "Yesterday", "Previous 7 Days", "Older"].map((group) => {
        const chats = groupedChats[group];
        if (!chats || chats.length === 0) return null;
        return (
          <div key={group}>
            {!isCollapsed && (
              <div style={{ padding: "16px 12px 8px", fontSize: "0.75rem", color: "#71717a", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                {group}
              </div>
            )}
            {chats.map((chat) => (
              <SidebarItem
                key={chat.id}
                icon={<FiMessageSquare />}
                label={searchQuery ? getHighlightedText(chat.title, searchQuery) : chat.title}
                active={chat.id === currentChatId}
                collapsed={isCollapsed}
                onClick={() => { onSelectChat(chat.id); setMobileOpen(false); }}
                onDelete={(e) => handleDeleteChat(e, chat.id)}
                innerRef={chat.id === currentChatId ? activeChatRef : null}
              />
            ))}
          </div>
        );
      })}
    </>
  );
}
