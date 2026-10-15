CREATE TABLE public.db_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  actor_email TEXT NOT NULL DEFAULT '',
  target_host TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  table_name TEXT,
  detail TEXT NOT NULL DEFAULT '',
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.db_audit_events TO authenticated;
GRANT ALL ON public.db_audit_events TO service_role;

ALTER TABLE public.db_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY db_audit_events_select_own ON public.db_audit_events
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY db_audit_events_insert_own ON public.db_audit_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);