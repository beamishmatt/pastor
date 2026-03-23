import { useState, useCallback, useRef, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type ChatMode = 'standard' | 'prayer' | 'study' | 'devotional';

export const CHAT_MODES: Array<{
  id: ChatMode;
  label: string;
  icon: string;
  description: string;
}> = [
  { id: 'standard',   label: 'Standard',   icon: 'message-circle', description: 'General conversation' },
  { id: 'prayer',     label: 'Prayer',      icon: 'heart',          description: 'Guided prayer & reflection' },
  { id: 'study',      label: 'Study',       icon: 'book-open',      description: 'Deep biblical study' },
  { id: 'devotional', label: 'Devotional',  icon: 'sun',            description: 'Daily devotions & quiet time' },
];

export interface CitedVerse {
  reference: string;
  book: string;
  chapter: number;
  verse: number;
  text?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citedVerses?: CitedVerse[];
  isStreaming?: boolean;
  hidden?: boolean;
  createdAt: Date;
}

export interface GeneratedPlan {
  slug: string;
  title: string;
  duration_days: number;
  plan_id: string;
}

interface ConversationState {
  messages: Message[];
  conversationId: string | null;
  isLoading: boolean;
  chatMode: ChatMode;
  setChatMode: (mode: ChatMode) => void;
  sendMessage: (text: string, options?: { hidden?: boolean; chat_scope?: string }) => Promise<void>;
  startNewConversation: () => void;
  loadConversation: (id: string) => Promise<void>;
  generatedPlan: GeneratedPlan | null;
  isPlanGenerating: boolean;
  clearGeneratedPlan: () => void;
}

// Parse [VERSE:Book Chapter:VerseNum] tokens from AI response
function parseCitedVerses(text: string): CitedVerse[] {
  const pattern = /\[VERSE:([^:]+)\s+(\d+):(\d+)\]/g;
  const verses: CitedVerse[] = [];
  let match;
  while ((match = pattern.exec(text)) !== null) {
    const book = match[1].trim();
    const chapter = parseInt(match[2], 10);
    const verse = parseInt(match[3], 10);
    verses.push({ reference: `${book} ${chapter}:${verse}`, book, chapter, verse });
  }
  return verses;
}

// The edge function stores cited_verses as string[] e.g. ["John 3:16"].
// Parse them back into CitedVerse objects for rendering.
function parseStoredVerses(raw: unknown): CitedVerse[] {
  if (!Array.isArray(raw)) return [];
  const out: CitedVerse[] = [];
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    const match = item.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (!match) continue;
    out.push({
      reference: item,
      book: match[1].trim(),
      chapter: parseInt(match[2], 10),
      verse: parseInt(match[3], 10),
    });
  }
  return out;
}

function cleanContent(text: string): string {
  return text
    .replace(/\[VERSE:[^\]]+\]/g, '')
    .replace(/\[GENERATE_PLAN:[\s\S]*$/, '') // strip marker (partial or complete) from display
    .trim();
}

const WELCOME_ID = 'assistant-welcome';

export function useConversation(translation: string = 'KJV'): ConversationState {
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: WELCOME_ID, role: 'assistant', content: '', isStreaming: true, createdAt: new Date() },
  ]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode>('standard');
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [isPlanGenerating, setIsPlanGenerating] = useState(false);
  const streamingMessageId = useRef<string | null>(null);
  // Always holds the latest session — updated synchronously by onAuthStateChange
  // so sendMessage never races against an in-flight getSession() call.
  const sessionRef = useRef<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      sessionRef.current = session;
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      sessionRef.current = session;
    });
    return () => subscription.unsubscribe();
  }, []);

  const clearGeneratedPlan = useCallback(() => setGeneratedPlan(null), []);

  // Stream daily verse into the welcome message on mount
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/daily-verse`, {
      headers: { apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY! },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        const fullText: string = data?.reflection ?? data?.text ?? '';
        if (!fullText) {
          setMessages([]);
          return;
        }
        const verseRef = data?.book ? `${data.book} ${data.chapter}:${data.verse}` : null;
        let i = 0;

        const tick = () => {
          if (cancelled) return;
          if (i >= fullText.length) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === WELCOME_ID
                  ? {
                      ...m,
                      content: fullText,
                      isStreaming: false,
                      citedVerses: verseRef ? [{
                        reference: verseRef,
                        book: data.book,
                        chapter: data.chapter,
                        verse: data.verse,
                      }] : [],
                    }
                  : m
              )
            );
            return;
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === WELCOME_ID ? { ...m, content: fullText.slice(0, i + 1) } : m
            )
          );
          i++;
          timer = setTimeout(tick, 18);
        };

        timer = setTimeout(tick, 300);
      })
      .catch(() => {
        if (!cancelled) setMessages([]);
      });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setChatMode('standard');
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setMessages([]);
    setConversationId(id);
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('messages')
        .select('id, role, content, cited_verses, created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(
          data.map((row) => ({
            id: row.id,
            role: row.role as 'user' | 'assistant',
            content: row.content,
            citedVerses: parseStoredVerses(row.cited_verses),
            createdAt: new Date(row.created_at),
          }))
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (text: string, options?: { hidden?: boolean; chat_scope?: string }) => {
      if (!text.trim() || isLoading) return;
      const isPrayerMode = chatMode === 'prayer';

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        hidden: options?.hidden ?? false,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      const assistantMessageId = `assistant-${Date.now()}`;
      streamingMessageId.current = assistantMessageId;

      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const session = sessionRef.current;
        if (!session) throw new Error('Not authenticated');

        // React Native fetch doesn't expose response.body as a ReadableStream.
        // Use XHR with onprogress for SSE streaming instead.
        let fullContent = '';
        let newConversationId = conversationId;

        // Extracted so we can retry on 401 with a fresh token.
        const doXHR = (accessToken: string): Promise<void> =>
          new Promise<void>((resolve, reject) => {
            // Reset shared mutable state so retries start clean.
            fullContent = '';
            newConversationId = conversationId;

            const xhr = new XMLHttpRequest();
            xhr.open(
              'POST',
              `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/chat`
            );
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.setRequestHeader('apikey', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

            let processed = 0;
            let buffer = '';

            const processLines = (newData: string) => {
              buffer += newData;
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.conversation_id && !newConversationId) {
                    newConversationId = parsed.conversation_id;
                    setConversationId(newConversationId);
                  }
                  if (parsed.delta) {
                    fullContent += parsed.delta;
                    setMessages((prev) =>
                      prev.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: cleanContent(fullContent) }
                          : m
                      )
                    );
                  }
                } catch {
                  // ignore malformed SSE lines
                }
              }
            };

            xhr.onprogress = () => {
              const newData = xhr.responseText.slice(processed);
              processed = xhr.responseText.length;
              processLines(newData);
            };

            xhr.onload = () => {
              const remaining = xhr.responseText.slice(processed);
              if (remaining) processLines(remaining);

              if (xhr.status === 401) {
                const err = new Error(`Chat error ${xhr.status}: ${xhr.responseText}`);
                (err as any).isAuthError = true;
                reject(err);
              } else if (xhr.status >= 400) {
                reject(new Error(`Chat error ${xhr.status}: ${xhr.responseText}`));
              } else {
                resolve();
              }
            };

            xhr.onerror = () => reject(new Error('Network request failed'));

            xhr.send(
              JSON.stringify({
                message: text.trim(),
                conversation_id: conversationId,
                user_id: session!.user.id,
                translation,
                chat_mode: chatMode,
                is_prayer_mode: isPrayerMode,
                chat_scope: options?.chat_scope,
              })
            );
          });

        // First attempt. On 401, force-refresh the session and retry once.
        // If the retry also fails, sign the user out so they get a clean state.
        try {
          await doXHR(session.access_token);
        } catch (e: any) {
          if (e.isAuthError) {
            const { data: { session: fresh }, error: refreshErr } =
              await supabase.auth.refreshSession();
            if (!refreshErr && fresh) {
              await doXHR(fresh.access_token);
            } else {
              supabase.auth.signOut();
              throw new Error('Your session has expired. Please sign in again.');
            }
          } else {
            throw e;
          }
        }

        const citedVerses = parseCitedVerses(fullContent);

        // Detect [GENERATE_PLAN:{...}] marker emitted by the chat edge function
        const planMarkerMatch = fullContent.match(/\[GENERATE_PLAN:(\{[\s\S]*?\})\]/);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: cleanContent(fullContent),
                  citedVerses,
                  isStreaming: false,
                }
              : m
          )
        );

        if (planMarkerMatch) {
          try {
            const planSpec = JSON.parse(planMarkerMatch[1]);
            setIsPlanGenerating(true);
            const { data: { session: planSession } } = await supabase.auth.getSession();
            const planResponse = await fetch(
              `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-plan`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
                  Authorization: `Bearer ${planSession?.access_token}`,
                },
                body: JSON.stringify({
                  user_id: planSession?.user.id,
                  plan_spec: planSpec,
                  conversation_id: newConversationId,
                }),
              }
            );
            if (planResponse.ok) {
              const plan: GeneratedPlan = await planResponse.json();
              setGeneratedPlan(plan);
            } else {
              console.error('generate-plan error:', await planResponse.text());
            }
          } catch (err) {
            console.error('Failed to generate plan:', err);
          } finally {
            setIsPlanGenerating(false);
          }
        }
      } catch (error) {
        console.error('sendMessage error:', error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  content: `Error: ${String(error)}`,
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        streamingMessageId.current = null;
      }
    },
    [isLoading, conversationId, translation, chatMode]
  );

  return {
    messages,
    conversationId,
    isLoading,
    chatMode,
    setChatMode,
    sendMessage,
    startNewConversation,
    loadConversation,
    generatedPlan,
    isPlanGenerating,
    clearGeneratedPlan,
  };
}
