import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Image, Plus, MessageSquare, Search, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useJobs } from "@/hooks/useApi";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function ChatPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [threadSearch, setThreadSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: jobs } = useJobs();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch threads
  const fetchThreads = async () => {
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch("/api/chat/threads-with-users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setThreads(data);
      }
    } catch (err) {
      console.error("Failed to fetch threads:", err);
    } finally {
      setLoadingThreads(false);
    }
  };

  // Fetch messages for a thread
  const fetchMessages = async (threadId: string) => {
    setLoadingMessages(true);
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch(`/api/chat/threads/${threadId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  // Auto-poll messages every 3 seconds when a thread is selected
  useEffect(() => {
    if (!selectedThread) return;
    fetchMessages(selectedThread);
    const interval = setInterval(() => {
      fetchMessages(selectedThread);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedThread]);

  // Auto-poll threads every 10 seconds
  useEffect(() => {
    const interval = setInterval(fetchThreads, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedThread) return;
    setSending(true);
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch(`/api/chat/threads/${selectedThread}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ body: newMessage }),
      });
      if (response.ok) {
        const msg = await response.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
      }
    } catch {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  // Create new thread (with or without a job)
  const handleCreateThread = async (isInternal: boolean = false) => {
    try {
      const token = localStorage.getItem("printhub_token");
      const response = await fetch("/api/chat/threads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          jobId: selectedJobId || null,
          isInternal,
        }),
      });
      if (response.ok) {
        const thread = await response.json();
        setThreads((prev) => [{ ...thread, jobInfo: null, lastMessage: null, messageCount: 0 }, ...prev]);
        setSelectedThread(thread.id);
        setNewThreadOpen(false);
        setSelectedJobId("");
        toast({ title: "Thread created", description: isInternal ? "Internal staff thread" : "New chat thread", variant: "success" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create thread", variant: "destructive" });
    }
  };

  const getThreadTitle = (thread: any) => {
    if (thread.jobInfo) {
      return `${thread.jobInfo.jobNumber} — ${thread.jobInfo.title}`;
    }
    return thread.isInternal ? "Staff Discussion" : "General Chat";
  };

  const getThreadSubtitle = (thread: any) => {
    if (thread.lastMessage) {
      const msgPreview = thread.lastMessage.body?.substring(0, 40) || "";
      return msgPreview + (thread.lastMessage.body?.length > 40 ? "..." : "");
    }
    return thread.isInternal ? "Internal staff thread" : "No messages yet";
  };

  const filteredThreads = threads.filter((t) =>
    threadSearch
      ? getThreadTitle(t).toLowerCase().includes(threadSearch.toLowerCase()) ||
        getThreadSubtitle(t).toLowerCase().includes(threadSearch.toLowerCase())
      : true
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-title-1 font-bold text-[var(--text-primary)]">Chat</h1>
          <p className="text-body text-[var(--text-secondary)] mt-1">
            Messages with customers on job threads
          </p>
        </div>
        <Dialog open={newThreadOpen} onOpenChange={setNewThreadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" />
              New Thread
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Chat Thread</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-subhead font-medium">Link to Job (optional)</label>
                <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                  <SelectTrigger>
                    <SelectValue placeholder="General thread (no job)" />
                  </SelectTrigger>
                  <SelectContent>
                    {(jobs || []).map((job: any) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.jobNumber} - {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleCreateThread(false)}>
                  Customer Thread
                </Button>
                <Button className="flex-1" variant="outline" onClick={() => handleCreateThread(true)}>
                  Staff Only
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 h-[calc(100vh-220px)]">
        {/* Thread list */}
        <div className="lg:col-span-1">
          <Card variant="strong" className="h-full flex flex-col">
            <div className="p-4 border-b border-[rgba(60,60,67,0.15)] space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={threadSearch}
                  onChange={(e) => setThreadSearch(e.target.value)}
                  className="glass-input text-sm pl-10"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingThreads ? (
                <div className="space-y-3 p-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-[var(--radius-md)] bg-[var(--glass-fill-subtle)] animate-pulse" />
                  ))}
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessageSquare className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                  <p className="text-subhead text-[var(--text-tertiary)]">
                    {threads.length === 0 ? "No conversations yet" : "No matching threads"}
                  </p>
                  <p className="text-caption text-[var(--text-tertiary)]">
                    {threads.length === 0 ? "Create a thread to start chatting" : "Try a different search"}
                  </p>
                </div>
              ) : (
                filteredThreads.map((thread: any) => (
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
                        {thread.isInternal ? "S" : "C"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-subhead font-semibold truncate">
                          {getThreadTitle(thread)}
                        </p>
                        {thread.isInternal && (
                          <Badge variant="secondary" className="text-[9px] flex-shrink-0">Internal</Badge>
                        )}
                      </div>
                      <p className="text-caption text-[var(--text-tertiary)] mt-0.5 truncate">
                        {getThreadSubtitle(thread)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      {thread.messageCount > 0 && (
                        <Badge variant="default" className="text-[9px] mb-1">{thread.messageCount}</Badge>
                      )}
                      {thread.lastMessage && (
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          {new Date(thread.lastMessage.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Message area */}
        <div className="lg:col-span-2">
          <Card variant="strong" className="h-full flex flex-col">
            {!selectedThread ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3" />
                  <p className="text-subhead text-[var(--text-tertiary)]">Select a conversation</p>
                  <p className="text-caption text-[var(--text-tertiary)]">or create a new thread</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[rgba(60,60,67,0.15)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {threads.find((t) => t.id === selectedThread)?.isInternal ? "S" : "C"}
                      </span>
                    </div>
                    <div>
                      <p className="text-subhead font-semibold">
                        {getThreadTitle(threads.find((t) => t.id === selectedThread) || {})}
                      </p>
                      <p className="text-caption text-[var(--text-tertiary)]">
                        {threads.find((t) => t.id === selectedThread)?.isInternal ? "Staff Chat" : "Customer Chat"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fetchMessages(selectedThread)}
                    className="text-[var(--text-tertiary)]"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className={`h-12 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse ${i % 2 === 0 ? "ml-auto" : ""}`} style={{ width: "60%" }} />
                      ))}
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageSquare className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-2" />
                      <p className="text-subhead text-[var(--text-tertiary)]">No messages yet</p>
                      <p className="text-caption text-[var(--text-tertiary)]">Send the first message</p>
                    </div>
                  ) : (
                    messages.map((msg: any) => {
                      const isOwn = msg.senderId === user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2.5 ${
                              isOwn
                                ? "bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] text-white"
                                : "glass-card"
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-[10px] font-semibold mb-1 text-[var(--accent-primary)]">
                                {msg.senderId === user?.id ? "You" : "Team"}
                              </p>
                            )}
                            <p className="text-subhead">{msg.body}</p>
                            <p
                              className={`text-[10px] mt-1 ${
                                isOwn ? "text-white/70" : "text-[var(--text-tertiary)]"
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
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
                    <Input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button size="icon" onClick={handleSendMessage} disabled={sending || !newMessage.trim()}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
