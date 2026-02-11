"use client";

import { useEffect, useMemo, useState } from "react";
import type { Attachment, ChatMessage, MediaItem, SessionSummary } from "@/types/chat";

const fileToDataUrl = (file: File) =>
  new Promise<Attachment>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve({
        name: file.name,
        mimeType: file.type,
        dataUrl: String(reader.result ?? "")
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function StudioPage() {
  const [mode, setMode] = useState<"chat" | "library">("chat");
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [loading, setLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editStartSec, setEditStartSec] = useState(0);
  const [editEndSec, setEditEndSec] = useState(8);

  const activeSessionTitle = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId)?.title ?? "New Chat";
  }, [sessions, activeSessionId]);

  const loadSessions = async () => {
    const res = await fetch("/api/sessions");
    const json = await res.json();
    setSessions(json.sessions ?? []);
  };

  const loadSessionMessages = async (sessionId: string) => {
    const res = await fetch(`/api/sessions?sessionId=${sessionId}`);
    const json = await res.json();
    const loaded: ChatMessage[] = (json.messages ?? []).map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      attachments: m.attachmentsJson ? JSON.parse(m.attachmentsJson) : undefined,
      createdAt: m.createdAt
    }));
    setMessages(loaded);
  };

  const loadMedia = async () => {
    const res = await fetch("/api/media");
    const json = await res.json();
    setMedia(json.media ?? []);
  };

  useEffect(() => {
    void loadSessions();
    void loadMedia();
  }, []);

  const handleSend = async () => {
    if (!text.trim() || loading) {
      return;
    }

    setLoading(true);
    try {
      const attachments = files ? await Promise.all(Array.from(files).map(fileToDataUrl)) : [];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId,
          message: text,
          attachments
        })
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "送信に失敗しました。");
      }
      setMessages(json.messages ?? []);
      setActiveSessionId(json.sessionId);
      setText("");
      setFiles(null);
      await Promise.all([loadSessions(), loadMedia()]);
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error instanceof Error ? error.message : "送信に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEdit = async () => {
    if (!selectedMedia || editLoading) {
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch("/api/media/edit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedMedia.sessionId,
          sourceUrl: selectedMedia.url,
          sourceKind: selectedMedia.kind,
          prompt: selectedMedia.prompt,
          startSec: Number(editStartSec),
          endSec: Number(editEndSec)
        })
      });
      const json = await res.json();
      if (json.mediaItem) {
        setSelectedMedia(json.mediaItem);
      }
      await loadMedia();
    } catch (error) {
      // eslint-disable-next-line no-alert
      alert(error instanceof Error ? error.message : "編集に失敗しました。");
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-[280px_1fr]">
      <aside className="border-r border-slate-800 bg-slate-950/70 p-4">
        <h1 className="mb-3 text-xl font-semibold">Studio</h1>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("chat")}
            className={`rounded px-3 py-2 text-sm ${mode === "chat" ? "bg-emerald-600 text-white" : "bg-slate-800"}`}
          >
            Chat
          </button>
          <button
            type="button"
            onClick={() => setMode("library")}
            className={`rounded px-3 py-2 text-sm ${mode === "library" ? "bg-emerald-600 text-white" : "bg-slate-800"}`}
          >
            Library / Edit
          </button>
        </div>
        <p className="mb-2 text-xs uppercase text-slate-400">チャット履歴</p>
        <div className="space-y-2">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={async () => {
                setActiveSessionId(session.id);
                await loadSessionMessages(session.id);
              }}
              className={`w-full rounded border p-2 text-left text-sm ${
                activeSessionId === session.id ? "border-emerald-500 bg-slate-800" : "border-slate-800 bg-slate-900"
              }`}
            >
              <div className="truncate">{session.title}</div>
              <div className="text-xs text-slate-400">{new Date(session.updatedAt).toLocaleString()}</div>
            </button>
          ))}
        </div>
      </aside>

      {mode === "chat" ? (
        <section className="flex min-h-screen flex-col">
          <header className="border-b border-slate-800 px-6 py-4 text-sm text-slate-300">{activeSessionTitle}</header>
          <div className="flex-1 space-y-4 overflow-y-auto p-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[70%] rounded-xl px-4 py-3 text-sm ${message.role === "user" ? "bg-emerald-600" : "bg-slate-800"}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.attachments?.length ? (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {message.attachments.map((attachment) => (
                        <img key={`${message.id}-${attachment.name}`} src={attachment.dataUrl} alt={attachment.name} className="rounded" />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-800 p-4">
            <p className="mb-2 text-xs text-slate-400">`/image` または `/video` で生成</p>
            <div className="flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="メッセージを入力"
                className="flex-1 rounded border border-slate-700 bg-slate-900 px-3 py-2"
              />
              <input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} className="max-w-52 text-sm" />
              <button
                type="button"
                disabled={loading}
                onClick={() => void handleSend()}
                className="rounded bg-emerald-600 px-4 py-2 disabled:opacity-40"
              >
                {loading ? "送信中" : "送信"}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid grid-cols-[1fr_320px] gap-4 p-6">
          <div>
            <h2 className="mb-3 text-lg font-semibold">生成済みメディア</h2>
            <div className="grid grid-cols-2 gap-3">
              {media.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedMedia(item);
                    setEditStartSec(0);
                    setEditEndSec(8);
                  }}
                  className={`overflow-hidden rounded border text-left ${selectedMedia?.id === item.id ? "border-emerald-500" : "border-slate-700"}`}
                >
                  {item.kind === "video" ? (
                    <video src={item.url} className="h-40 w-full object-cover" muted />
                  ) : (
                    <img src={item.url} alt={item.prompt} className="h-40 w-full object-cover" />
                  )}
                  <div className="p-2 text-xs">
                    <div className="font-semibold uppercase text-emerald-400">{item.kind}</div>
                    <div className="truncate text-slate-300">{item.prompt}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded border border-slate-700 bg-slate-900 p-4">
            <h3 className="mb-3 font-semibold">編集モード</h3>
            {selectedMedia ? (
              <>
                {selectedMedia.kind === "video" ? (
                  <video src={selectedMedia.url} controls className="mb-3 rounded" />
                ) : (
                  <img src={selectedMedia.url} alt={selectedMedia.prompt} className="mb-3 rounded" />
                )}
                <p className="mb-2 text-xs text-slate-300">Prompt: {selectedMedia.prompt}</p>
                <label className="mb-2 block text-xs">
                  Start(sec)
                  <input
                    type="number"
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1"
                    value={editStartSec}
                    onChange={(e) => setEditStartSec(Number(e.target.value))}
                  />
                </label>
                <label className="mb-3 block text-xs">
                  End(sec)
                  <input
                    type="number"
                    className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1"
                    value={editEndSec}
                    onChange={(e) => setEditEndSec(Number(e.target.value))}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void handleCreateEdit()}
                  disabled={editLoading}
                  className="w-full rounded bg-emerald-600 px-3 py-2 text-sm disabled:opacity-40"
                >
                  {editLoading ? "編集中..." : "Remotionで編集ジョブ作成"}
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-400">左のメディアを選択してください。</p>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
