-- 005_reading_plans_delete.sql
-- Allow users to delete their own AI-generated reading plans

ALTER TABLE reading_plans
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE POLICY "users_delete_own_ai_plans" ON reading_plans
  FOR DELETE USING (
    is_ai_generated = true AND created_by = auth.uid()
  );
