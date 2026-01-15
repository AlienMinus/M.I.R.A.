import { useState, useEffect, useRef } from "react";
import { FiMessageSquare } from "react-icons/fi";
import SidebarItem from "./SidebarItem";

export default function ChatHistory({ 
  currentChatId, 
  onSelectChat, 
  onNewChat, 
  setMobileOpen, 
  isCollapsed,
  mobileOpen 
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
                chats.push({ id, title, timestamp });
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

  savedChats.forEach((chat) => {
    const date = new Date(chat.timestamp);
    if (date >= today) groupedChats["Today"].push(chat);
    else if (date >= yesterday) groupedChats["Yesterday"].push(chat);
    else if (date >= sevenDaysAgo) groupedChats["Previous 7 Days"].push(chat);
    else groupedChats["Older"].push(chat);
  });

  if (isCollapsed) return null;

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
                label={chat.title}
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
