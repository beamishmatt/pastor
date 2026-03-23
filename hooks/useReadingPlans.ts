import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface ReadingPlan {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_days: number;
  tags: string[];
  books: string[];
  themes: string[];
  is_pro: boolean;
  is_ai_generated: boolean;
}

export interface PlanReading {
  id: string;
  plan_id: string;
  day_number: number;
  title: string;
  passage_ref: string;
  book: string;
  chapter: number;
  verse_start: number | null;
  verse_end: number | null;
  reflection_prompt: string | null;
}

export interface PlanEnrollment {
  id: string;
  user_id: string;
  plan_id: string;
  started_at: string;
  completed_at: string | null;
  last_read_at: string | null;
  current_day: number;
}

export interface PlanCompletion {
  id: string;
  enrollment_id: string;
  day_number: number;
  completed_at: string;
  notes: string | null;
}

export interface PlanRecommendation {
  plan: ReadingPlan;
  reason: string;
  score: number;
}

interface JourneyEntity {
  entity_type: string;
  entity_key: string;
  mention_count: number;
  relevance_score: number;
}

const DEFAULT_STARTER_SLUGS = ['prayer-praise', 'nt-30', 'life-of-jesus'];

function scorePlan(
  plan: ReadingPlan,
  entities: JourneyEntity[]
): { score: number; reason: string } {
  if (!entities.length) {
    return { score: 0, reason: 'A great place to begin your journey' };
  }

  let score = 0;
  let reason: string | null = null;

  for (const entity of entities) {
    const ek = entity.entity_key.toLowerCase();
    const weight = entity.mention_count * entity.relevance_score;

    if (entity.entity_type === 'theme') {
      if (plan.themes.some(t => t.toLowerCase() === ek)) {
        score += weight * 3;
        if (!reason) reason = `Based on your interest in ${entity.entity_key}`;
      }
    }

    if (entity.entity_type === 'book') {
      if (plan.books.some(b => b.toLowerCase() === ek)) {
        score += weight * 2;
        if (!reason) reason = `Because you've been exploring ${entity.entity_key}`;
      }
    }

    if (entity.entity_type === 'life_context') {
      if (plan.tags.some(tag => ek.includes(tag.toLowerCase()) || tag.toLowerCase().includes(ek))) {
        score += weight * 3;
        if (!reason) reason = `For your season of ${entity.entity_key}`;
      }
    }

    if (entity.entity_type === 'prayer_topic') {
      if (plan.themes.some(t => ek.includes(t.toLowerCase()) || t.toLowerCase().includes(ek))) {
        score += weight * 2;
        if (!reason) reason = `To deepen your prayers around ${entity.entity_key}`;
      }
    }
  }

  return {
    score,
    reason: reason ?? 'A plan for where you are in your journey',
  };
}

export function useReadingPlans(userId: string | null) {
  const [plans, setPlans] = useState<ReadingPlan[]>([]);
  const [enrollments, setEnrollments] = useState<PlanEnrollment[]>([]);
  const [completions, setCompletions] = useState<Record<string, PlanCompletion[]>>({});
  const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      const [plansRes, enrollmentsRes, journeyRes] = await Promise.all([
        supabase.from('reading_plans').select('*').order('is_pro', { ascending: true }),
        supabase.from('plan_enrollments').select('*').eq('user_id', userId),
        supabase
          .from('user_journey')
          .select('entity_type,entity_key,mention_count,relevance_score')
          .eq('user_id', userId)
          .order('mention_count', { ascending: false })
          .limit(20),
      ]);

      const allPlans: ReadingPlan[] = (plansRes.data ?? []) as ReadingPlan[];
      const userEnrollments: PlanEnrollment[] = (enrollmentsRes.data ?? []) as PlanEnrollment[];
      const journeyEntities: JourneyEntity[] = (journeyRes.data ?? []) as JourneyEntity[];

      setPlans(allPlans);
      setEnrollments(userEnrollments);

      // Compute recommendations — exclude already-enrolled plans
      const enrolledIds = new Set(userEnrollments.map(e => e.plan_id));
      const unenrolled = allPlans.filter(p => !enrolledIds.has(p.id));

      let scored: PlanRecommendation[] = unenrolled
        .map(plan => {
          const { score, reason } = scorePlan(plan, journeyEntities);
          return { plan, score, reason };
        })
        .sort((a, b) => b.score - a.score);

      // If no journey data yet, surface the default starter plans
      if (!journeyEntities.length) {
        scored = unenrolled
          .filter(p => DEFAULT_STARTER_SLUGS.includes(p.slug))
          .map(plan => ({
            plan,
            score: 0,
            reason: 'A great place to begin your journey',
          }));
      }

      setRecommendations(scored.slice(0, 3));

      // Load completions for active enrollments
      if (userEnrollments.length > 0) {
        const { data: completionData } = await supabase
          .from('plan_completions')
          .select('*')
          .in('enrollment_id', userEnrollments.map(e => e.id));

        const grouped: Record<string, PlanCompletion[]> = {};
        for (const c of completionData ?? []) {
          if (!grouped[c.enrollment_id]) grouped[c.enrollment_id] = [];
          grouped[c.enrollment_id].push(c as PlanCompletion);
        }
        setCompletions(grouped);
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const enroll = useCallback(
    async (planId: string): Promise<PlanEnrollment> => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('plan_enrollments')
        .insert({ user_id: userId, plan_id: planId, current_day: 1 })
        .select()
        .single();
      if (error) throw error;
      await loadData();
      return data as PlanEnrollment;
    },
    [userId, loadData]
  );

  const markDayComplete = useCallback(
    async (enrollmentId: string, dayNumber: number, notes?: string) => {
      const { error: completionErr } = await supabase
        .from('plan_completions')
        .upsert({ enrollment_id: enrollmentId, day_number: dayNumber, notes: notes ?? null });
      if (completionErr) throw completionErr;

      const { error: updateErr } = await supabase
        .from('plan_enrollments')
        .update({ current_day: dayNumber + 1, last_read_at: new Date().toISOString() })
        .eq('id', enrollmentId);
      if (updateErr) throw updateErr;

      await loadData();
    },
    [loadData]
  );

  const getEnrollmentForPlan = useCallback(
    (planId: string): PlanEnrollment | null =>
      enrollments.find(e => e.plan_id === planId) ?? null,
    [enrollments]
  );

  const getCompletedDays = useCallback(
    (enrollmentId: string): number[] =>
      (completions[enrollmentId] ?? []).map(c => c.day_number),
    [completions]
  );

  const getProgress = useCallback(
    (enrollmentId: string, totalDays: number): number => {
      const completed = (completions[enrollmentId] ?? []).length;
      return totalDays > 0 ? completed / totalDays : 0;
    },
    [completions]
  );

  // Deletes the user's enrollment (and completions via cascade).
  // For AI-generated plans the user created, also deletes the plan itself
  // (readings + enrollments cascade from reading_plans ON DELETE CASCADE).
  const deletePlan = useCallback(
    async (plan: ReadingPlan): Promise<void> => {
      if (!userId) throw new Error('Not authenticated');

      if (plan.is_ai_generated) {
        // Deleting the plan cascades to plan_readings + plan_enrollments + plan_completions
        const { error } = await supabase
          .from('reading_plans')
          .delete()
          .eq('id', plan.id);
        if (error) throw error;
      } else {
        // Curated plan — only remove the user's enrollment (completions cascade)
        const { error } = await supabase
          .from('plan_enrollments')
          .delete()
          .eq('plan_id', plan.id)
          .eq('user_id', userId);
        if (error) throw error;
      }

      await loadData();
    },
    [userId, loadData]
  );

  return {
    plans,
    enrollments,
    recommendations,
    isLoading,
    enroll,
    markDayComplete,
    deletePlan,
    getEnrollmentForPlan,
    getCompletedDays,
    getProgress,
    reload: loadData,
  };
}
