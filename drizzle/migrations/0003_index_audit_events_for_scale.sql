create index if not exists db_audit_events_user_at_idx
  on public.db_audit_events (user_id, at desc);

create index if not exists db_audit_events_action_idx
  on public.db_audit_events (action);

create index if not exists db_audit_events_table_idx
  on public.db_audit_events (table_name) where table_name is not null;