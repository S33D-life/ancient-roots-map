import { useState, useRef, useEffect } from "react";
import { useChat, ChatMessage } from "@/hooks/use-chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Send,
  X,
  Users,
  TreeDeciduous,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const ChatPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [showRooms, setShowRooms] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    rooms,
    activeRoom,
    setActiveRoom,
    messages,
    onlineUsers,
    sendMessage,
    userId,
    userDisplayName,
  } = useChat();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "AF";

  const getRoomIcon = (type: string) => {
    switch (type) {
      case "tree":
        return <TreeDeciduous className="w-3.5 h-3.5" />;
      default:
        return <MessageCircle className="w-3.5 h-3.5" />;
    }
  };

  // Don't render if not authenticated
  if (!userId) return null;

  return (
    <>
      {/* Floating toggle button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 relative"
              size="icon"
            >
              <MessageCircle className="h-6 w-6" />
              {onlineUsers.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 text-[10px] font-bold flex items-center justify-center text-white border-2 border-background">
                  {onlineUsers.length}
                </span>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-96 z-50 flex flex-col bg-card border-l border-border shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card/95 backdrop-blur">
              <div className="flex items-center gap-3">
                {showRooms ? (
                  <h3 className="font-serif text-foreground text-lg">Rooms</h3>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setShowRooms(true)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                      <h3 className="font-serif text-foreground text-sm leading-tight">
                        {activeRoom?.name || "Chat"}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-[10px] text-muted-foreground">
                          {onlineUsers.length} online
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Room list */}
            {showRooms ? (
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-1">
                  {/* Online users section */}
                  <div className="px-2 py-3">
                    <div className="flex items-center gap-2 mb-3">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="text-xs uppercase tracking-widest text-muted-foreground font-serif">
                        Online — {onlineUsers.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {onlineUsers.map((u) => (
                        <div
                          key={u.user_id}
                          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-secondary/50 text-xs"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                          <span className="text-foreground">
                            {u.display_name || "Ancient Friend"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-border pt-3 px-2">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-serif">
                      Rooms
                    </span>
                  </div>

                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => {
                        setActiveRoom(room);
                        setShowRooms(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-mystical",
                        activeRoom?.id === room.id
                          ? "bg-primary/15 text-primary"
                          : "hover:bg-secondary/50 text-foreground"
                      )}
                    >
                      {getRoomIcon(room.type)}
                      <span className="font-serif text-sm">{room.name}</span>
                      <Badge
                        variant="outline"
                        className="ml-auto text-[10px] px-1.5 py-0"
                      >
                        {room.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <>
                {/* Messages */}
                <ScrollArea className="flex-1 px-3" ref={scrollRef}>
                  <div className="py-3 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center py-12">
                        <MessageCircle className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-sm text-muted-foreground font-serif">
                          No messages yet. Start the conversation!
                        </p>
                      </div>
                    )}
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.user_id === userId}
                        getInitials={getInitials}
                        formatTime={formatTime}
                      />
                    ))}
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t border-border bg-card/95 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <Input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Send a message..."
                      maxLength={2000}
                      className="flex-1 bg-secondary/50 border-border font-serif text-sm"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim()}
                      size="icon"
                      className="h-9 w-9 shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

function MessageBubble({
  message,
  isOwn,
  getInitials,
  formatTime,
}: {
  message: ChatMessage;
  isOwn: boolean;
  getInitials: (name: string) => string;
  formatTime: (date: string) => string;
}) {
  return (
    <div
      className={cn(
        "flex gap-2",
        isOwn ? "flex-row-reverse" : "flex-row"
      )}
    >
      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
        <AvatarImage src={message.avatar_url || undefined} />
        <AvatarFallback className="text-[10px] bg-secondary text-secondary-foreground">
          {getInitials(message.display_name || "AF")}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2",
          isOwn
            ? "bg-primary/20 text-foreground rounded-br-md"
            : "bg-secondary/60 text-foreground rounded-bl-md"
        )}
      >
        {!isOwn && (
          <p className="text-[10px] font-serif text-primary mb-0.5">
            {message.display_name || "Ancient Friend"}
          </p>
        )}
        <p className="text-sm leading-relaxed break-words">{message.content}</p>
        <p
          className={cn(
            "text-[9px] mt-1",
            isOwn ? "text-primary/50 text-right" : "text-muted-foreground/60"
          )}
        >
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  );
}

export default ChatPanel;
