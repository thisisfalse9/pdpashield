import type { State } from "./store";

export const PLANS = {
  trial: { name: "Free Trial", price: 0, note: "14 days", scans: 20, storageGb: 1, seats: 2, dbs: 0, workflows: "Core", audit: "30-day log", integrations: "—", support: "Docs" },
  starter: { name: "Basic", price: 49, note: "/month", scans: 200, storageGb: 10, seats: 5, dbs: 1, workflows: "Core + Policies", audit: "6-month log", integrations: "CSV/XLSX", support: "Email" },
  professional: { name: "Standard", price: 99, note: "/month", scans: 1000, storageGb: 50, seats: 15, dbs: 3, workflows: "All workflows", audit: "2-year log + export", integrations: "PostgreSQL, storage", support: "Priority email" },
  enterprise: { name: "Premium", price: 199 as number | null, note: "/month", scans: 99999, storageGb: 500, seats: 100, dbs: 20, workflows: "All + custom", audit: "Unlimited + SIEM", integrations: "Custom", support: "Dedicated manager" },
} as const;

export const seed = (): State => ({
  role: "Admin",
  profile: { name: "Harry Tan", email: "harry@tanco-accounting.sg", lang: "English", dateFormat: "DD/MM/YYYY" },
  org: { name: "Tan & Co Accounting (Demo)", uen: "201912345K", industry: "Accounting & Audit", size: "11-25", timezone: "Asia/Singapore", currency: "SGD", retentionMonths: 60 },
  docs: [
    { id: "d1", name: "Client Onboarding Form.pdf", category: "Forms", owner: "Priya Raman", version: "v3", uploaded: "2026-09-12", status: "Reviewed", size: 184000, links: ["Data Protection Policy", "Client consent"], demo: true },
    { id: "d2", name: "Xero DPA 2026.pdf", category: "Contracts", owner: "Harry Tan", version: "v1", uploaded: "2026-08-03", status: "Reviewed", size: 402000, links: ["Supplier: Xero"], demo: true },
    { id: "d3", name: "Payroll Register Sep.xlsx", category: "Records", owner: "Lee Hui Min", version: "v1", uploaded: "2026-10-01", status: "Pending Review", size: 96000, links: ["AI Readiness scan"], demo: true },
    { id: "d4", name: "Retention Schedule.docx", category: "Policies", owner: "Harry Tan", version: "v2", uploaded: "2026-06-20", status: "Expired", size: 51000, links: ["Retention Policy"], demo: true },
    { id: "d5", name: "Client List Q3.csv", category: "Records", owner: "Marcus Ong", version: "v1", uploaded: "2026-10-09", status: "Pending Review", size: 22000, links: [], demo: true },
  ],
  policies: [
    { id: "p1", title: "Data Protection Policy", owner: "Harry Tan", roles: ["All staff"], status: "Published", effective: "2026-01-01", version: 3, body: "This policy sets out how Tan & Co collects, uses and discloses personal data in line with the PDPA.", controls: ["c1", "c2"], comments: [], history: [{ version: 1, at: "2024-03-01", note: "Initial" }, { version: 2, at: "2025-01-10", note: "Added DNC section" }, { version: 3, at: "2026-01-01", note: "Annual review" }], demo: true },
    { id: "p2", title: "Data Breach Management Plan", owner: "Priya Raman", roles: ["DPO", "Partners"], status: "Pending Approval", effective: "2026-11-01", version: 2, body: "Steps to assess, contain and notify PDPC within 3 calendar days for notifiable breaches.", controls: ["c6"], comments: [{ by: "Harry Tan", text: "Add escalation contacts.", at: "2026-10-10" }], history: [{ version: 1, at: "2025-05-01", note: "Initial" }, { version: 2, at: "2026-10-08", note: "Updated timelines" }], demo: true },
    { id: "p3", title: "Retention & Disposal Policy", owner: "Lee Hui Min", roles: ["All staff"], status: "Draft", effective: "", version: 1, body: "Records are retained for 5 years after engagement ends, then securely disposed.", controls: ["c5"], comments: [], history: [{ version: 1, at: "2026-10-02", note: "Draft" }], demo: true },
  ],
  controls: [
    { id: "c1", obligation: "Accountability", question: "Has a Data Protection Officer been appointed and their contact published?", weight: 3 },
    { id: "c2", obligation: "Consent", question: "Is consent obtained and recorded before collecting client personal data?", weight: 3 },
    { id: "c3", obligation: "Purpose Limitation", question: "Are purposes for collection documented and communicated?", weight: 2 },
    { id: "c4", obligation: "Protection", question: "Are reasonable security arrangements (access control, encryption) in place?", weight: 3 },
    { id: "c5", obligation: "Retention Limitation", question: "Is personal data disposed of when no longer needed?", weight: 2 },
    { id: "c6", obligation: "Data Breach Notification", question: "Is there a tested breach response plan with 3-day PDPC notification?", weight: 3 },
    { id: "c7", obligation: "Transfer Limitation", question: "Are overseas transfers covered by comparable protection?", weight: 2 },
    { id: "c8", obligation: "Access & Correction", question: "Can individuals request access to and correction of their data?", weight: 1 },
    { id: "c9", obligation: "NRIC Advisory", question: "Is full NRIC collection limited to legally required cases?", weight: 2 },
    { id: "c10", obligation: "Do Not Call", question: "Are marketing numbers checked against the DNC Registry?", weight: 1 },
  ],
  answers: { c1: "Yes", c2: "Yes", c3: "Partial", c4: "Partial", c5: "No", c6: "Partial", c7: "Yes", c8: "Yes", c9: "No", c10: "N/A" },
  evidence: { c1: "DPO appointment letter.pdf" },
  reviewerNotes: {},
  assessments: [
    { id: "a1", at: "2026-04-01", score: 52, by: "Harry Tan" },
    { id: "a2", at: "2026-06-01", score: 58, by: "Harry Tan" },
    { id: "a3", at: "2026-08-01", score: 63, by: "Priya Raman" },
    { id: "a4", at: "2026-10-01", score: 68, by: "Priya Raman" },
  ],
  nextAssessment: "2026-12-01",
  tasks: [
    { id: "t1", title: "Implement secure disposal of expired client files", owner: "Lee Hui Min", due: "2026-10-31", done: false, control: "c5" },
    { id: "t2", title: "Replace NRIC field with last-4 on onboarding form", owner: "Priya Raman", due: "2026-11-15", done: false, control: "c9" },
    { id: "t3", title: "Run breach tabletop exercise", owner: "Harry Tan", due: "2026-11-30", done: false, control: "c6" },
  ],
  scans: [
    { id: "s1", at: "2026-10-09T09:12:00Z", file: "Client List Q3.csv", rows: 412, findings: 1236, privacyRisk: 78, dataQuality: 91, aiReadiness: 56, masked: false },
    { id: "s2", at: "2026-10-09T09:20:00Z", file: "Client List Q3.csv", rows: 412, findings: 1236, privacyRisk: 12, dataQuality: 91, aiReadiness: 90, masked: true },
    { id: "s3", at: "2026-10-01T03:40:00Z", file: "Payroll Register Sep.xlsx", rows: 24, findings: 72, privacyRisk: 84, dataQuality: 97, aiReadiness: 56, masked: false },
  ],
  suppliers: [
    { id: "sp1", name: "Xero", service: "Cloud accounting", contact: "privacy@xero.com", data: "Client financials, contact info", location: "Australia / USA", dpa: "Signed", review: "Completed", risk: "Medium", nextReview: "2027-08-01", archived: false, demo: true },
    { id: "sp2", name: "Google Workspace", service: "Email & storage", contact: "Account rep", data: "Emails, documents", location: "Global", dpa: "Signed", review: "Completed", risk: "Medium", nextReview: "2027-02-01", archived: false, demo: true },
    { id: "sp3", name: "PaySG Payroll", service: "Payroll processing", contact: "ops@paysg.example", data: "Employee NRIC, salary, bank", location: "Singapore", dpa: "Pending", review: "In Progress", risk: "High", nextReview: "2026-11-10", archived: false, demo: true },
    { id: "sp4", name: "ShredPro SG", service: "Document disposal", contact: "+65 6000 1111", data: "Paper records", location: "Singapore", dpa: "None", review: "Not Started", risk: "Low", nextReview: "2026-12-15", archived: false, demo: true },
  ],
  questionnaire: [
    ["Access Control", "Is MFA enforced for all staff accounts?"],
    ["Access Control", "Are user accounts reviewed at least quarterly?"],
    ["Data Protection", "Is personal data encrypted at rest?"],
    ["Data Protection", "Is data in transit protected with TLS 1.2+?"],
    ["Endpoint", "Are laptops encrypted and remotely wipeable?"],
    ["Endpoint", "Is anti-malware deployed and updated?"],
    ["Incident Response", "Is there a documented incident response plan?"],
    ["Incident Response", "Has the plan been tested in the past 12 months?"],
    ["Vendor", "Are suppliers assessed before onboarding?"],
    ["Training", "Do staff receive annual data protection training?"],
  ].map(([section, q], i) => ({ id: "q" + i, section, q, resp: (i < 3 ? "Implemented" : i < 5 ? "Partial" : "") as "", evidence: "", notes: "", owner: "", reviewDate: "" })),
  aiRisks: [
    { id: "r1", model: "Invoice Classifier v1.2", at: "2026-09-20", status: "Approved", answers: { privacy: 3, bias: 2, accuracy: 3, security: 2, transparency: 2, impact: 3 }, likelihood: 2, impact: 3, mitigations: [{ text: "Mask NRIC before inference", owner: "Priya Raman", due: "2026-10-30" }] },
  ],
  plan: "starter",
  billing: "monthly",
  members: [
    { id: "m1", name: "Harry Tan", email: "harry@tanco-accounting.sg", role: "Admin", status: "Active" },
    { id: "m2", name: "Priya Raman", email: "priya@tanco-accounting.sg", role: "DPO", status: "Active" },
    { id: "m3", name: "Lee Hui Min", email: "huimin@tanco-accounting.sg", role: "Compliance Officer", status: "Active" },
    { id: "m4", name: "Marcus Ong", email: "marcus@tanco-accounting.sg", role: "Business User", status: "Invited" },
  ],
  notifyPrefs: {
    deadlines: { inApp: true, email: true },
    scans: { inApp: true, email: false },
    risk: { inApp: true, email: true },
    approvals: { inApp: true, email: false },
  },
  notices: [
    { id: "n1", at: "2026-10-14T08:00:00Z", title: "Data Breach Management Plan awaiting approval", read: false, kind: "policy" },
    { id: "n2", at: "2026-10-13T02:00:00Z", title: "Supplier PaySG review due 10 Nov", read: false, kind: "deadline" },
    { id: "n3", at: "2026-10-09T09:12:00Z", title: "Scan found 412 NRIC values in Client List Q3.csv", read: true, kind: "scan" },
  ],
  sessionTimeout: 30,
});
