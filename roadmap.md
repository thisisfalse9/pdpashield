# Live monitoring and BERT/Kafka integration

- [x] Connect Lovable Cloud without migrating existing demo flows.
- [x] Identify the database to monitor: the user's own Supabase project (read-only key saved as MONITOR_DB_URL / MONITOR_DB_KEY).
- [ ] Ship the one-paste setup script that creates sample tables plus a table-listing helper in the user's project. Blocked: the user must run it in their own project.
- [ ] Connect the trained BERT PII model. Blocked: model artifact or hosted inference service is not supplied.
- [ ] Connect Kafka activity ingestion. Blocked: Kafka service and topic details are not supplied.
- [ ] Add authenticated access to real monitoring data, preserving the existing demo experience.
- [ ] Verify real database activity appears in monitoring/auditing and actual BERT findings appear in AI readiness.