import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: Date;
}

export function useConversationHistory(refreshTrigger?: string | null) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);

  const refresh = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('conversations')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100);

    if (data) {
      setConversations(
        data.map((c) => ({
          id: c.id,
          title: c.title ?? 'Untitled',
          updatedAt: new Date(c.updated_at),
        }))
      );
    }
  }, []);

  // Fetch on mount and whenever a new conversation is created
  useEffect(() => {
    refresh();
  }, [refresh, refreshTrigger]);

  return { conversations, refresh };
}
