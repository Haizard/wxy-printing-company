import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Image } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Thread {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  jobId: string;
}

interface Message {
  id: string;
  sender: string;
  body: string;
  timestamp: string;
  isOwn: boolean;
}

const threads: Thread[] = [
  { id: "t1", name: "Acme Corp", lastMessage: "The banners look great! When can we pick up?", timestamp: "2m ago", unread: 2, jobId: "JOB-0042" },
  { id: "t2", name: "Tech Solutions", lastMessage: "Please send the proof for review", timestamp: "15m ago", unread: 0, jobId: "JOB-0041" },
  { id: "t3", name: "Green Valley School", lastMessage: "We'd like to add 50 more ID cards", timestamp: "1h ago", unread: 1, jobId: "JOB-0039" },
  { id: "t4", name: "Fashion House", lastMessage: "Thank you for the canvas prints!", timestamp: "3h ago", unread: 0, jobId: "JOB-0038" },
];

const sampleMessages: Message[] = [
  { id: "m1", sender: "John (Acme Corp)", body: "Hi! We received the roll-up banners and they look fantastic.", timestamp: "10:30 AM", isOwn: false },
  { id: "m2", sender: "You", body: "Thank you! Glad you're happy with them. Is there anything else you need?", timestamp: "10:32 AM", isOwn: true },
  { id: "m3", sender: "John (Acme Corp)", body: "Actually, could we get a quote for 200 business cards as well? Double-sided.", timestamp: "10:35 AM", isOwn: false },
  { id: "m4", sender: "You", body: "Of course! I'll prepare a quote for double-sided business cards. What GSM would you prefer?", timestamp: "10:36 AM", isOwn: true },
  { id: "m5", sender: "John (Acme Corp)", body: "The banners look great! When can we pick up?", timestamp: "10:40 AM", isOwn: false },
];

export default function ChatPage() {
  const [selectedThread, setSelectedThread] = useState<string | null>("t1");
  const [newMessage, setNewMessage] = useState("");

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Chat</h1>
        <p className="text-body text-[var(--text-secondary)] mt-1">
          Messages with customers on job threads
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-220px)]">
        {/* Thread list */}
        <div className="lg:col-span-1">
          <Card variant="strong" className="h-full flex flex-col">
            <div className="p-4 border-b border-[rgba(60,60,67,0.15)]">
              <input
                type="text"
                placeholder="Search conversations..."
                className="glass-input text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                  className={`w-full flex items-start gap-3 p-4 text-left transition-colors border-b border-[rgba(60,60,67,0.08)] ${
                    selectedThread === thread.id
                      ? "bg-[rgba(255,90,60,0.06)]"
                      : "hover:bg-[rgba(255,90,60,0.03)]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-sm">
                      {thread.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-subhead font-semibold truncate">{thread.name}</p>
                      <span className="text-caption text-[var(--text-tertiary)] flex-shrink-0">{thread.timestamp}</span>
                    </div>
                    <p className="text-caption text-[var(--text-tertiary)] truncate mt-0.5">{thread.lastMessage}</p>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1">{thread.jobId}</p>
                  </div>
                  {thread.unread > 0 && (
                    <Badge className="flex-shrink-0 mt-1">{thread.unread}</Badge>
                  )}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Message area */}
        <div className="lg:col-span-2">
          <Card variant="strong" className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-[rgba(60,60,67,0.15)]">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] flex items-center justify-center">
                <span className="text-white font-semibold text-sm">A</span>
              </div>
              <div>
                <p className="text-subhead font-semibold">Acme Corp</p>
                <p className="text-caption text-[var(--text-tertiary)]">JOB-0042 · Roll-up Banner</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {sampleMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2.5 ${
                      msg.isOwn
                        ? "bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] text-white"
                        : "glass-card"
                    }`}
                  >
                    <p className="text-subhead">{msg.body}</p>
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.isOwn ? "text-white/70" : "text-[var(--text-tertiary)]"
                      }`}
                    >
                      {msg.timestamp}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-[rgba(60,60,67,0.15)]">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Image className="w-5 h-5" />
                </Button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 glass-input py-2"
                />
                <Button size="icon" disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
