"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useChatChannels, useChatMessages, useSendChat } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-store";
import type { ChatMessage } from "@/lib/types";
import {
  Button,
  Card,
  CardBody,
  Input,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { cn } from "@aktensystem/ui";
import { useSocket } from "@/lib/ws";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatPage() {
  const userId = useAuth((s) => s.user?.id ?? "");
  const { data: channels } = useChatChannels();
  const [channel, setChannel] = useState("GLOBAL");
  const { data: messages, isLoading, error } = useChatMessages(channel);
  const send = useSendChat(channel);
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // dedup-Append in den Query-Cache (eigene Nachricht + WS-Broadcast).
  function append(m: ChatMessage) {
    qc.setQueryData<ChatMessage[]>(["chat-messages", m.channel], (old) => {
      const list = old ?? [];
      if (list.some((x) => x.id === m.id)) return list;
      return [...list, m];
    });
  }

  useSocket(
    {
      "chat:message": (p) => {
        const m = p as ChatMessage;
        if (m.channel === channel) append(m);
      },
    },
    [],
    [channel],
  );

  // ans Ende scrollen bei neuen Nachrichten
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function submit() {
    const body = text.trim();
    if (!body) return;
    send.mutate(body, {
      onSuccess: (m) => {
        append(m);
        setText("");
      },
    });
  }

  return (
    <div>
      <PageHeader title="LEO-Chat" subtitle="Interner Behördenfunk im Textkanal" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        {/* Kanal-Liste */}
        <Card className="h-fit">
          <CardBody className="space-y-1">
            {(channels ?? [{ key: "GLOBAL", label: "Global" }]).map((c) => (
              <button
                key={c.key}
                onClick={() => setChannel(c.key)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent",
                  channel === c.key && "bg-accent font-medium",
                )}
              >
                <span># {c.label}</span>
              </button>
            ))}
          </CardBody>
        </Card>

        {/* Nachrichten */}
        <Card className="flex h-[70vh] flex-col">
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {isLoading ? (
              <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
            ) : error ? (
              <ErrorState error={error} />
            ) : !messages || messages.length === 0 ? (
              <EmptyState title="Noch keine Nachrichten" hint="Schreib die erste Nachricht." />
            ) : (
              messages.map((m) => {
                const mine = m.senderId === userId;
                return (
                  <div key={m.id} className={cn("flex flex-col", mine && "items-end")}>
                    <div className={cn("max-w-[75%] rounded-lg px-3 py-2 text-sm", mine ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                      {!mine && <div className="mb-0.5 text-xs font-medium opacity-80">{m.senderName}</div>}
                      <div className="whitespace-pre-wrap break-words">{m.body}</div>
                    </div>
                    <span className="mt-0.5 text-[10px] text-muted-foreground">{timeLabel(m.createdAt)}</span>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
              placeholder="Nachricht…"
            />
            <Button onClick={submit} disabled={!text.trim() || send.isPending}>Senden</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
