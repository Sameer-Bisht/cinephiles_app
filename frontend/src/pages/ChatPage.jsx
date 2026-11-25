import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, MessageSquare, Send, User as UserIcon, X } from 'lucide-react';
import { chatApi } from '../api/chat.api';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';

export function ChatPage() {
  const { user } = useAuthStore();
  const socket = useSocketStore((s) => s.socket);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const [tab, setTab] = useState('inbox'); // 'inbox' | 'requests'
  const [activeId, setActiveId] = useState(searchParams.get('c') || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [otherTyping, setOtherTyping] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [sendError, setSendError] = useState('');

  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const conversationsQuery = useQuery({
    queryKey: ['chat', 'conversations'],
    queryFn: chatApi.getConversations,
  });

  const allConversations = conversationsQuery.data || [];
  const inboxConversations = allConversations.filter(
    (c) => c.status === 'accepted' || (c.status === 'pending' && c.requestedBy === user?._id)
  );
  const requestConversations = allConversations.filter(
    (c) => c.status === 'pending' && c.requestedBy !== user?._id
  );

  const visibleList = tab === 'inbox' ? inboxConversations : requestConversations;
  const activeConversation = allConversations.find((c) => c._id === activeId) || null;

  const messagesQuery = useQuery({
    queryKey: ['chat', 'messages', activeId],
    queryFn: () => chatApi.getMessages(activeId),
    enabled: Boolean(activeId),
  });

  useEffect(() => {
    if (messagesQuery.data?.results) {
      setMessages(messagesQuery.data.results);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messagesQuery.data]);

  // Join active conversation room & mark read
  useEffect(() => {
    if (!activeId) return;
    setSearchParams({ c: activeId }, { replace: true });
    chatApi.markRead(activeId).then(() => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    });

    if (socket) {
      socket.emit('chat:join', { conversationId: activeId });
      socket.emit('chat:read', { conversationId: activeId });
    }
  }, [activeId, socket, setSearchParams, queryClient]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const onMessage = ({ conversationId, message }) => {
      if (conversationId === activeId) {
        setMessages((prev) =>
          prev.some((m) => m._id === message._id) ? prev : [...prev, message]
        );
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
        socket.emit('chat:read', { conversationId });
      }
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    };

    const onInboxUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    };

    const onTyping = ({ conversationId, userId, isTyping }) => {
      if (conversationId === activeId && userId !== user?._id) {
        setOtherTyping(isTyping);
      }
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:inbox_update', onInboxUpdate);
    socket.on('chat:typing', onTyping);

    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:inbox_update', onInboxUpdate);
      socket.off('chat:typing', onTyping);
    };
  }, [socket, activeId, user?._id, queryClient]);

  const startMutation = useMutation({
    mutationFn: (username) => chatApi.startConversation(username),
    onSuccess: (conv) => {
      setNewUsername('');
      setTab('inbox');
      setActiveId(conv._id);
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ conversationId, action }) => chatApi.respondToRequest(conversationId, action),
    onSuccess: (conv, vars) => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'conversations'] });
      if (vars.action === 'accept') {
        setTab('inbox');
        setActiveId(conv._id);
      } else {
        setActiveId(null);
      }
    },
  });

  const handleTypingChange = (val) => {
    setText(val);
    if (!socket || !activeId) return;
    socket.emit('chat:typing', { conversationId: activeId, isTyping: true });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('chat:typing', { conversationId: activeId, isTyping: false });
    }, 1200);
  };

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || !activeId || !socket) return;
    setSendError('');

    socket.emit('chat:send', { conversationId: activeId, text: trimmed }, (ack) => {
      if (ack?.ok) {
        setText('');
        socket.emit('chat:typing', { conversationId: activeId, isTyping: false });
      } else {
        setSendError(ack?.error || 'Failed to send message');
      }
    });
  };

  const isIncomingPending =
    activeConversation?.status === 'pending' && activeConversation?.requestedBy !== user?._id;

  return (
    <div className="grid h-[calc(100vh-8.5rem)] overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 md:grid-cols-3">
      {/* Left Sidebar: Inbox & Requests */}
      <aside className="flex flex-col border-b border-zinc-800 md:border-b-0 md:border-r">
        <div className="border-b border-zinc-800 p-4 space-y-3">
          <div className="flex gap-2 rounded-xl bg-zinc-950 p-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setTab('inbox')}
              className={`flex-1 rounded-lg py-1.5 transition ${
                tab === 'inbox' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Chats ({inboxConversations.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('requests')}
              className={`flex-1 rounded-lg py-1.5 transition ${
                tab === 'requests' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Requests ({requestConversations.length})
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newUsername.trim()) startMutation.mutate(newUsername.trim());
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Start chat with @username"
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={startMutation.isPending}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-500"
            >
              Chat
            </button>
          </form>
          {startMutation.isError && (
            <p className="text-xs text-red-400">
              {startMutation.error?.response?.data?.message || 'User not found'}
            </p>
          )}
        </div>

        <div className="flex-1 divide-y divide-zinc-800/60 overflow-y-auto">
          {visibleList.length === 0 ? (
            <p className="p-6 text-center text-xs text-zinc-500">
              {tab === 'inbox' ? 'No conversations yet.' : 'No message requests.'}
            </p>
          ) : (
            visibleList.map((conv) => {
              const other = conv.otherParticipant;
              const isActive = conv._id === activeId;
              return (
                <button
                  key={conv._id}
                  type="button"
                  onClick={() => setActiveId(conv._id)}
                  className={`flex w-full items-center gap-3 p-3.5 text-left transition ${
                    isActive ? 'bg-violet-600/15' : 'hover:bg-zinc-900'
                  }`}
                >
                  {other?.avatarUrl ? (
                    <img
                      src={other.avatarUrl}
                      alt={other.displayName}
                      className="h-10 w-10 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
                      <UserIcon className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-white">
                        {other?.displayName || other?.username}
                      </p>
                      {conv.myUnreadCount > 0 && (
                        <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {conv.myUnreadCount}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-400">
                      {conv.lastMessage?.text || `@${other?.username}`}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Right: Message Window */}
      <section className="flex flex-col md:col-span-2">
        {!activeConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-zinc-500">
            <MessageSquare className="h-8 w-8" />
            <p className="text-sm">Select a conversation or start one by @username</p>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-3.5">
              <div>
                <p className="font-semibold text-white">
                  {activeConversation.otherParticipant?.displayName ||
                    activeConversation.otherParticipant?.username}
                </p>
                <p className="text-xs text-zinc-500">
                  @{activeConversation.otherParticipant?.username}
                  {otherTyping && <span className="ml-2 text-violet-400">typing...</span>}
                </p>
              </div>
              {activeConversation.status === 'pending' && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-300">
                  Request Pending
                </span>
              )}
            </header>

            {isIncomingPending && (
              <div className="flex items-center justify-between gap-3 border-b border-zinc-800 bg-amber-500/5 px-5 py-3 text-xs">
                <span className="text-amber-200">
                  @{activeConversation.otherParticipant?.username} wants to message you.
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      respondMutation.mutate({ conversationId: activeId, action: 'accept' })
                    }
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-500"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      respondMutation.mutate({ conversationId: activeId, action: 'decline' })
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 px-3 py-1.5 font-semibold text-zinc-300 hover:bg-zinc-800"
                  >
                    <X className="h-3.5 w-3.5" />
                    Decline
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {messages.map((msg) => {
                const isMine = msg.sender?._id === user?._id || msg.sender === user?._id;
                return (
                  <div
                    key={msg._id}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isMine
                          ? 'bg-violet-600 text-white'
                          : 'border border-zinc-800 bg-zinc-950 text-zinc-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {sendError && <p className="px-5 pb-1 text-xs text-red-400">{sendError}</p>}

            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-zinc-800 p-4"
            >
              <input
                type="text"
                disabled={isIncomingPending}
                value={text}
                onChange={(e) => handleTypingChange(e.target.value)}
                placeholder={
                  isIncomingPending ? 'Accept the request to reply...' : 'Type a message...'
                }
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isIncomingPending || !text.trim()}
                className="inline-flex items-center justify-center rounded-xl bg-violet-600 p-2.5 text-white transition hover:bg-violet-500 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
