# Live monitoring and BERT/Kafka integration

- [x] Connect Lovable Cloud without migrating existing demo flows.
- [x] Identify the database to monitor: the user's own Supabase project (read-only key saved as MONITOR_DB_URL / MONITOR_DB_KEY).
- [x] Ship the one-paste setup script (`public/monitor-setup.sql`) that creates sample tables plus a table-listing helper in the user's project.
- [x] Add authenticated access to real monitoring data, preserving the existing demo experience.
- [x] Verify the reader, masking and audit-trail loop against a real database (sample tables in this workspace's own backend, since removed from use and labelled DEPRECATED).
- [ ] Confirm findings on the user's own tables. Blocked: the setup script must be pasted and run in the user's own project first.
- [ ] Connect the trained BERT PII model. Blocked: model artifact or hosted inference service is not supplied.
- [ ] Connect Kafka activity ingestion. Blocked: Kafka service and topic details are not supplied.
- [ ] Add authenticated access to real monitoring data, preserving the existing demo experience.
- [ ] Verify real database activity appears in monitoring/auditing and actual BERT findings appear in AI readiness.