import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Inbox,
  Mail,
  MailOpen,
  Trash2,
  Reply,
  Phone,
  CheckCheck,
  RotateCcw,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "read";
  createdAt: string | null;
}

type Filter = "all" | "new" | "read";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "read", label: "Read" },
];

export default function ContactMessagesPage() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("new");
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch("/api/contact-messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages(await res.json());
      } else {
        toast({ title: "Failed to load messages", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to load messages", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const updateStatus = async (msg: ContactMessage, status: "new" | "read") => {
    setBusyId(msg.id);
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch(`/api/contact-messages/${msg.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, status } : m)),
        );
      } else {
        toast({ title: "Failed to update message", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to update message", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const deleteMessage = async (msg: ContactMessage) => {
    if (!confirm(`Delete the message from ${msg.name}?`)) return;
    setBusyId(msg.id);
    try {
      const token = localStorage.getItem("printhub_token");
      const res = await fetch(`/api/contact-messages/${msg.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        toast({ title: "Message deleted", variant: "success" });
      } else {
        toast({ title: "Failed to delete message", variant: "destructive" });
      }
    } catch {
      toast({ title: "Failed to delete message", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const counts = {
    all: messages.length,
    new: messages.filter((m) => m.status === "new").length,
    read: messages.filter((m) => m.status === "read").length,
  };

  const visible =
    filter === "all"
      ? messages
      : messages.filter((m) => m.status === filter);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-title-1 font-bold text-[var(--text-primary)]">
              Contact Messages
            </h1>
            <p className="text-body text-[var(--text-secondary)] mt-1">
              Messages from the website contact form
            </p>
          </div>
          <div className="flex items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-pill text-subhead font-medium transition-all flex items-center gap-2 ${
                  filter === f.key
                    ? "bg-[var(--accent-primary)] text-white"
                    : "bg-[var(--glass-fill-subtle)] text-[var(--text-secondary)] hover:bg-[var(--glass-fill)]"
                }`}
              >
                {f.label}
                {counts[f.key] > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      filter === f.key
                        ? "bg-white/20"
                        : f.key === "new"
                          ? "bg-[var(--accent-primary)] text-white"
                          : "bg-[var(--glass-fill)]"
                    }`}
                  >
                    {counts[f.key]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-[var(--radius-lg)] bg-[var(--glass-fill-subtle)] animate-pulse"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Inbox className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-4" />
            <p className="text-title-3 font-semibold text-[var(--text-secondary)] mb-2">
              {counts.new === 0 && filter === "new"
                ? "No new messages — you're all caught up!"
                : "No messages here yet"}
            </p>
            <p className="text-body text-[var(--text-tertiary)]">
              When visitors submit the contact form on the website, their
              messages will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((msg, index) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
            >
              <Card
                className={
                  msg.status === "new"
                    ? "border-l-4 border-l-[var(--accent-primary)]"
                    : ""
                }
              >
                <CardContent className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        {msg.status === "new" ? (
                          <Badge className="bg-[var(--accent-primary)] text-white">
                            <Mail className="w-3 h-3 mr-1" /> New
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <MailOpen className="w-3 h-3 mr-1" /> Read
                          </Badge>
                        )}
                        <span className="text-caption text-[var(--text-tertiary)]">
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleString()
                            : ""}
                        </span>
                      </div>
                      <h3 className="text-headline font-semibold text-[var(--text-primary)]">
                        {msg.subject}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap text-caption text-[var(--text-secondary)] mt-1">
                        <span className="font-medium">{msg.name}</span>
                        <span className="text-[var(--text-tertiary)]">•</span>
                        <a
                          href={`mailto:${msg.email}`}
                          className="hover:text-[var(--accent-primary)] transition-colors"
                        >
                          {msg.email}
                        </a>
                        {msg.phone && (
                          <>
                            <span className="text-[var(--text-tertiary)]">•</span>
                            <a
                              href={`tel:${msg.phone.replace(/\s/g, "")}`}
                              className="hover:text-[var(--accent-primary)] transition-colors flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" /> {msg.phone}
                            </a>
                          </>
                        )}
                      </div>
                      <p className="text-body text-[var(--text-secondary)] mt-3 whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {msg.status === "new" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === msg.id}
                          onClick={() => updateStatus(msg, "read")}
                        >
                          <CheckCheck className="w-4 h-4 mr-1" /> Mark Read
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={busyId === msg.id}
                          onClick={() => updateStatus(msg, "new")}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" /> Mark New
                        </Button>
                      )}
                      <a
                        href={`mailto:${msg.email}?subject=${encodeURIComponent(
                          `Re: ${msg.subject}`,
                        )}`}
                        className="inline-flex items-center justify-center gap-1 min-h-[44px] px-3 rounded-pill text-subhead font-medium text-[var(--accent-primary)] hover:bg-[rgba(255,90,60,0.08)] transition-colors"
                      >
                        <Reply className="w-4 h-4" />
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[var(--accent-danger)]"
                        disabled={busyId === msg.id}
                        onClick={() => deleteMessage(msg)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
