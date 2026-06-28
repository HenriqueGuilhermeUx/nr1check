import {
  boolean,
  integer,
  bigint,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
  doublePrecision,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const companyTypeEnum = pgEnum("company_type", [
  "empresa",
  "prefeitura",
  "orgao_publico",
]);
export const companySizeEnum = pgEnum("company_size", [
  "micro",
  "pequena",
  "media",
  "grande",
]);
export const stripePlanEnum = pgEnum("stripe_plan", [
  "nr1_solo",
  "nr1_pro",
  "corporate",
]);
export const employeeStatusEnum = pgEnum("employee_status", [
  "ativo",
  "inativo",
  "afastado",
]);
export const managerRoleEnum = pgEnum("manager_role", [
  "owner",
  "rh",
  "sst",
  "viewer",
]);
export const scaleTypeEnum = pgEnum("scale_type", [
  "frequency",
  "degree",
  "agreement",
]);
export const cycleStatusEnum = pgEnum("cycle_status", [
  "draft",
  "active",
  "closed",
  "archived",
]);
export const riskLevelEnum = pgEnum("risk_level", [
  "baixo",
  "medio",
  "alto",
  "critico",
]);
export const courseCategoryEnum = pgEnum("course_category", [
  "assedio",
  "stress",
  "cnv",
  "etica",
  "nr1",
  "outros",
]);
export const moduleTypeEnum = pgEnum("module_type", ["text", "quiz"]);
export const progressStatusEnum = pgEnum("progress_status", [
  "nao_iniciado",
  "em_andamento",
  "concluido",
]);
export const complaintCategoryEnum = pgEnum("complaint_category", [
  "assedio_moral",
  "assedio_sexual",
  "discriminacao",
  "violencia",
  "burnout",
  "outros",
]);
export const complaintStatusEnum = pgEnum("complaint_status", [
  "recebida",
  "em_apuracao",
  "concluida",
  "arquivada",
]);
export const pgrStatusEnum = pgEnum("pgr_status", [
  "draft",
  "generated",
  "signed",
  "submitted",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "questionario",
  "curso",
  "denuncia",
  "pgr",
  "risco_critico",
  "pagamento",
  "sistema",
]);
export const riskTypeEnum = pgEnum("risk_type", [
  "fisico",
  "quimico",
  "biologico",
  "ergonomico",
  "acidente",
  "psicossocial",
]);
export const severityEnum = pgEnum("severity", ["baixo", "medio", "alto"]);
export const reviewReasonEnum = pgEnum("review_reason", [
  "periodica",
  "mudanca_processo",
  "incidente",
  "fiscalizacao",
  "outro",
]);
export const incidentStatusEnum = pgEnum("incident_status", [
  "aberto",
  "em_analise",
  "encerrado",
]);

// ═══════════════════════════════════════════════════════════════════════════════
// USERS (gestores — sincronizado com Clerk via webhook)
// ═══════════════════════════════════════════════════════════════════════════════
export const users = pgTable(
  "users",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    clerkUserId: varchar("clerk_user_id", { length: 64 }).notNull().unique(),
    name: text("name"),
    email: varchar("email", { length: 320 }).notNull(),
    imageUrl: text("image_url"),
    role: userRoleEnum("role").default("user").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  }),
);
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// COMPANIES
// ═══════════════════════════════════════════════════════════════════════════════
export const companies = pgTable(
  "companies",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    ownerId: integer("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    cnpj: varchar("cnpj", { length: 18 }).notNull().unique(),
    type: companyTypeEnum("type").default("empresa").notNull(),
    size: companySizeEnum("size").default("micro").notNull(),
    cnaeCode: varchar("cnae_code", { length: 10 }),
    cnaeDescription: varchar("cnae_description", { length: 255 }),
    sector: varchar("sector", { length: 120 }),
    address: text("address"),
    city: varchar("city", { length: 100 }),
    state: varchar("state", { length: 2 }),
    phone: varchar("phone", { length: 20 }),
    logoUrl: text("logo_url"),
    // Stripe
    stripeCustomerId: varchar("stripe_customer_id", { length: 64 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 64 }),
    stripePlan: stripePlanEnum("stripe_plan"),
    stripeStatus: varchar("stripe_status", { length: 32 }),
    // Compliance
    pgrDueDate: timestamp("pgr_due_date"),
    onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    ownerIdx: index("companies_owner_idx").on(t.ownerId),
    cnpjIdx: uniqueIndex("companies_cnpj_idx").on(t.cnpj),
  }),
);
export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// MANAGERS (vínculo gestor-empresa)
// ═══════════════════════════════════════════════════════════════════════════════
export const managers = pgTable(
  "managers",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    managerRole: managerRoleEnum("manager_role").default("rh").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    userCompanyIdx: uniqueIndex("managers_user_company_idx").on(t.userId, t.companyId),
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENTS
// ═══════════════════════════════════════════════════════════════════════════════
export const departments = pgTable(
  "departments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    companyIdx: index("departments_company_idx").on(t.companyId),
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// EMPLOYEES (funcionários — login via CPF + token WhatsApp)
// ═══════════════════════════════════════════════════════════════════════════════
export const employees = pgTable(
  "employees",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    departmentId: integer("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 255 }).notNull(),
    cpf: varchar("cpf", { length: 14 }).notNull(),
    email: varchar("email", { length: 320 }),
    phone: varchar("phone", { length: 20 }),
    role: varchar("role", { length: 120 }),
    isManager: boolean("is_manager").default(false).notNull(),
    // Token de acesso (enviado via WhatsApp, expira em 15 min)
    accessToken: varchar("access_token", { length: 6 }),
    tokenExpiresAt: timestamp("token_expires_at"),
    status: employeeStatusEnum("status").default("ativo").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    companyIdx: index("employees_company_idx").on(t.companyId),
    cpfIdx: index("employees_cpf_idx").on(t.cpf),
    companyCpfIdx: uniqueIndex("employees_company_cpf_idx").on(t.companyId, t.cpf),
  }),
);
export type Employee = typeof employees.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════════
// COPSOQ QUESTIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const copsoqQuestions = pgTable(
  "copsoq_questions",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    order: integer("order").notNull(),
    dimension: varchar("dimension", { length: 80 }).notNull(),
    subdimension: varchar("subdimension", { length: 80 }),
    text: text("text").notNull(),
    scaleType: scaleTypeEnum("scale_type").default("frequency").notNull(),
    reverseScore: boolean("reverse_score").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
  },
  (t) => ({
    orderIdx: uniqueIndex("copsoq_order_idx").on(t.order),
  }),
);
export type CopsoqQuestion = typeof copsoqQuestions.$inferSelect;

// ═══════════════════════════════════════════════════════════════════════════════
// ASSESSMENT CYCLES
// ═══════════════════════════════════════════════════════════════════════════════
export const assessmentCycles = pgTable(
  "assessment_cycles",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    status: cycleStatusEnum("status").default("draft").notNull(),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    totalInvited: integer("total_invited").default(0),
    totalResponded: integer("total_responded").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    companyIdx: index("cycles_company_idx").on(t.companyId),
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// ASSESSMENT RESPONSES
// ═══════════════════════════════════════════════════════════════════════════════
export const assessmentResponses = pgTable(
  "assessment_responses",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    cycleId: integer("cycle_id")
      .notNull()
      .references(() => assessmentCycles.id, { onDelete: "cascade" }),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    departmentId: integer("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    answers: json("answers").$type<Record<number, number>>().notNull(),
    scores: json("scores").$type<Record<string, number>>(),
    riskLevel: riskLevelEnum("risk_level"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    cycleEmployeeIdx: uniqueIndex("responses_cycle_employee_idx").on(t.cycleId, t.employeeId),
    cycleIdx: index("responses_cycle_idx").on(t.cycleId),
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// DEPARTMENT RISK SCORES
// ═══════════════════════════════════════════════════════════════════════════════
export const departmentRiskScores = pgTable(
  "department_risk_scores",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    cycleId: integer("cycle_id")
      .notNull()
      .references(() => assessmentCycles.id, { onDelete: "cascade" }),
    departmentId: integer("department_id")
      .notNull()
      .references(() => departments.id, { onDelete: "cascade" }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    scores: json("scores").$type<Record<string, number>>().notNull(),
    overallRisk: riskLevelEnum("overall_risk").notNull(),
    respondentCount: integer("respondent_count").default(0),
    calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
  },
  (t) => ({
    cycleDeptIdx: uniqueIndex("risk_cycle_dept_idx").on(t.cycleId, t.departmentId),
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// COURSES & MODULES
// ═══════════════════════════════════════════════════════════════════════════════
export const courses = pgTable(
  "courses",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }), // null = curso global
    title: varchar("title", { length: 255 }).notNull(),
    description: text("description"),
    category: courseCategoryEnum("category").notNull(),
    estimatedMinutes: integer("estimated_minutes").default(10),
    isMandatory: boolean("is_mandatory").default(true).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    order: integer("order").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);
export const courseModules = pgTable(
  "course_modules",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    order: integer("order").notNull(),
    type: moduleTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);
export const courseProgress = pgTable(
  "course_progress",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    courseId: integer("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    currentModuleId: integer("current_module_id"),
    completedModules: json("completed_modules").$type<number[]>().default([]),
    quizScores: json("quiz_scores").$type<Record<number, number>>().default({}),
    status: progressStatusEnum("status").default("nao_iniciado").notNull(),
    completedAt: timestamp("completed_at"),
    certificateUrl: text("certificate_url"),
    certificateHash: varchar("certificate_hash", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLAINTS (denúncias anônimas)
// ═══════════════════════════════════════════════════════════════════════════════
export const complaints = pgTable(
  "complaints",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    // Anonimato: sem FK para employee
    category: complaintCategoryEnum("category").notNull(),
    description: text("description").notNull(),
    involvedDepartment: varchar("involved_department", { length: 120 }),
    attachmentUrls: json("attachment_urls").$type<string[]>().default([]),
    // Protocolo imutável
    protocolNumber: varchar("protocol_number", { length: 32 }).notNull().unique(),
    protocolHash: varchar("protocol_hash", { length: 64 }).notNull(), // SHA-256
    protocolTimestamp: bigint("protocol_timestamp", { mode: "number" }).notNull(), // Unix ms
    // Gestão
    status: complaintStatusEnum("status").default("recebida").notNull(),
    assignedTo: integer("assigned_to").references(() => users.id, {
      onDelete: "set null",
    }),
    resolution: text("resolution"),
    resolvedAt: timestamp("resolved_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    companyIdx: index("complaints_company_idx").on(t.companyId),
    statusIdx: index("complaints_status_idx").on(t.status),
  }),
);
export const complaintUpdates = pgTable(
  "complaint_updates",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    complaintId: integer("complaint_id")
      .notNull()
      .references(() => complaints.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    note: text("note").notNull(),
    statusChange: varchar("status_change", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

// ═══════════════════════════════════════════════════════════════════════════════
// PGR REPORTS
// ═══════════════════════════════════════════════════════════════════════════════
export const pgrReports = pgTable(
  "pgr_reports",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    cycleId: integer("cycle_id").references(() => assessmentCycles.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    status: pgrStatusEnum("status").default("draft").notNull(),
    pdfUrl: text("pdf_url"),
    xmlUrl: text("xml_url"), // eSocial S-2240
    signatureHash: varchar("signature_hash", { length: 128 }),
    generatedAt: timestamp("generated_at"),
    signedAt: timestamp("signed_at"),
    validUntil: timestamp("valid_until"),
    metadata: json("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const notifications = pgTable(
  "notifications",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
    employeeId: integer("employee_id").references(() => employees.id, {
      onDelete: "cascade",
    }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    message: text("message").notNull(),
    actionUrl: text("action_url"),
    read: boolean("read").default(false).notNull(),
    sentVia: json("sent_via").$type<string[]>().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    companyIdx: index("notifications_company_idx").on(t.companyId),
    userIdx: index("notifications_user_idx").on(t.userId),
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════════
export const auditLog = pgTable(
  "audit_log",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
    companyId: integer("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 120 }).notNull(),
    entity: varchar("entity", { length: 64 }),
    entityId: integer("entity_id"),
    metadata: json("metadata"),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

// ═══════════════════════════════════════════════════════════════════════════════
// STRIPE EVENTS
// ═══════════════════════════════════════════════════════════════════════════════
export const stripeEvents = pgTable(
  "stripe_events",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    stripeEventId: varchar("stripe_event_id", { length: 64 }).notNull().unique(),
    type: varchar("type", { length: 64 }).notNull(),
    companyId: integer("company_id").references(() => companies.id, {
      onDelete: "set null",
    }),
    payload: json("payload"),
    processed: boolean("processed").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPLIANCE — CNAE, Ordens de Serviço, EPI, Incidentes, Revisão PGR
// ═══════════════════════════════════════════════════════════════════════════════
export const cnaeRisks = pgTable(
  "cnae_risks",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    cnaeCode: varchar("cnae_code", { length: 10 }).notNull(),
    cnaeDescription: varchar("cnae_description", { length: 255 }).notNull(),
    riskType: riskTypeEnum("risk_type").notNull(),
    riskDescription: text("risk_description").notNull(),
    severity: severityEnum("severity").default("medio").notNull(),
    requiredDocuments: json("required_documents").$type<string[]>().notNull(),
    requiresEpi: boolean("requires_epi").default(false).notNull(),
    epiDescription: text("epi_description"),
    legalBasis: varchar("legal_basis", { length: 120 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    cnaeIdx: index("cnae_risks_code_idx").on(t.cnaeCode),
  }),
);

export const serviceOrders = pgTable(
  "service_orders",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    departmentId: integer("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    jobTitle: varchar("job_title", { length: 120 }).notNull(),
    mainActivities: text("main_activities").notNull(),
    identifiedRisks: text("identified_risks").notNull(),
    safetyInstructions: text("safety_instructions").notNull(),
    employeeId: integer("employee_id").references(() => employees.id, {
      onDelete: "set null",
    }),
    employeeName: varchar("employee_name", { length: 120 }),
    signedAt: timestamp("signed_at"),
    signatureIp: varchar("signature_ip", { length: 45 }),
    pdfUrl: text("pdf_url"),
    documentHash: varchar("document_hash", { length: 64 }),
    version: integer("version").default(1).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);

export const epiRecords = pgTable(
  "epi_records",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    employeeId: integer("employee_id")
      .notNull()
      .references(() => employees.id, { onDelete: "cascade" }),
    epiName: varchar("epi_name", { length: 120 }).notNull(),
    epiCa: varchar("epi_ca", { length: 20 }),
    purpose: text("purpose").notNull(),
    quantity: integer("quantity").default(1).notNull(),
    deliveredAt: timestamp("delivered_at").defaultNow().notNull(),
    signedAt: timestamp("signed_at"),
    signatureIp: varchar("signature_ip", { length: 45 }),
    pdfUrl: text("pdf_url"),
    documentHash: varchar("document_hash", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

export const incidentRecords = pgTable(
  "incident_records",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    departmentId: integer("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    occurredAt: timestamp("occurred_at").notNull(),
    location: varchar("location", { length: 120 }),
    description: text("description").notNull(),
    hasInjury: boolean("has_injury").default(false).notNull(),
    injuryDescription: text("injury_description"),
    immediateAction: text("immediate_action").notNull(),
    preventiveMeasures: text("preventive_measures").notNull(),
    status: incidentStatusEnum("status").default("aberto").notNull(),
    registeredById: integer("registered_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    registeredByName: varchar("registered_by_name", { length: 120 }),
    registeredByIp: varchar("registered_by_ip", { length: 45 }),
    documentHash: varchar("document_hash", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
);

export const pgrReviews = pgTable(
  "pgr_reviews",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    reviewReason: reviewReasonEnum("review_reason").default("periodica").notNull(),
    conclusion: text("conclusion").notNull(),
    changesRequired: boolean("changes_required").default(false).notNull(),
    changesDescription: text("changes_description"),
    nextReviewDate: timestamp("next_review_date").notNull(),
    responsibleId: integer("responsible_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    responsibleName: varchar("responsible_name", { length: 120 }),
    responsibleIp: varchar("responsible_ip", { length: 45 }),
    pdfUrl: text("pdf_url"),
    documentHash: varchar("document_hash", { length: 64 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

// ═══════════════════════════════════════════════════════════════════════════════
// PSYCHOSOCIAL PERSISTENCE — Achados, inventário, documentos, assinaturas
// Cole este bloco em packages/db/src/schema.ts ANTES do bloco "RELATIONS"
// ═══════════════════════════════════════════════════════════════════════════════

export const psychosocialFindings = pgTable(
  "psychosocial_findings",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    cycleId: integer("cycle_id")
      .notNull()
      .references(() => assessmentCycles.id, { onDelete: "cascade" }),
    dimension: varchar("dimension", { length: 120 }).notNull(),
    averageScore: integer("average_score").default(0).notNull(),
    riskLevel: riskLevelEnum("risk_level").default("baixo").notNull(),
    respondentCount: integer("respondent_count").default(0).notNull(),
    findingText: text("finding_text").notNull(),
    recommendedAction: text("recommended_action").notNull(),
    evidence: text("evidence"),
    source: varchar("source", { length: 80 }).default("assessment_cycle").notNull(),
    status: varchar("status", { length: 32 }).default("suggested").notNull(),
    createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    companyCycleDimensionIdx: uniqueIndex("psychosocial_findings_company_cycle_dimension_idx").on(
      t.companyId,
      t.cycleId,
      t.dimension,
    ),
    companyIdx: index("psychosocial_findings_company_idx").on(t.companyId),
    cycleIdx: index("psychosocial_findings_cycle_idx").on(t.cycleId),
  }),
);
export type PsychosocialFinding = typeof psychosocialFindings.$inferSelect;

export const psychosocialRiskInventory = pgTable(
  "psychosocial_risk_inventory",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    cycleId: integer("cycle_id").references(() => assessmentCycles.id, { onDelete: "set null" }),
    findingId: integer("finding_id").references(() => psychosocialFindings.id, { onDelete: "set null" }),
    department: varchar("department", { length: 160 }).notNull(),
    role: varchar("role", { length: 160 }),
    factor: varchar("factor", { length: 160 }).notNull(),
    description: text("description").notNull(),
    evidence: text("evidence"),
    consequences: text("consequences"),
    exposedWorkers: text("exposed_workers"),
    probability: integer("probability").default(3).notNull(),
    severity: integer("severity").default(3).notNull(),
    riskLevel: riskLevelEnum("risk_level").default("medio").notNull(),
    existingMeasures: text("existing_measures"),
    recommendedAction: text("recommended_action").notNull(),
    responsible: varchar("responsible", { length: 160 }),
    deadline: timestamp("deadline"),
    monitoring: text("monitoring"),
    actionStatus: varchar("action_status", { length: 32 }).default("pendente").notNull(),
    createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    companyIdx: index("psychosocial_inventory_company_idx").on(t.companyId),
    cycleIdx: index("psychosocial_inventory_cycle_idx").on(t.cycleId),
    findingIdx: index("psychosocial_inventory_finding_idx").on(t.findingId),
  }),
);
export type PsychosocialRiskInventory = typeof psychosocialRiskInventory.$inferSelect;

export const psychosocialDocuments = pgTable(
  "psychosocial_documents",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    cycleId: integer("cycle_id").references(() => assessmentCycles.id, { onDelete: "set null" }),
    templateId: varchar("template_id", { length: 80 }).notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    status: varchar("status", { length: 32 }).default("gerado").notNull(),
    notes: text("notes"),
    pdfUrl: text("pdf_url"),
    documentHash: varchar("document_hash", { length: 128 }),
    metadata: json("metadata").$type<Record<string, unknown>>().default({}),
    generatedById: integer("generated_by_id").references(() => users.id, { onDelete: "set null" }),
    generatedAt: timestamp("generated_at").defaultNow(),
    signedAt: timestamp("signed_at"),
    archivedAt: timestamp("archived_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    companyIdx: index("psychosocial_documents_company_idx").on(t.companyId),
    cycleIdx: index("psychosocial_documents_cycle_idx").on(t.cycleId),
  }),
);

export const psychosocialDocumentSignatures = pgTable(
  "psychosocial_document_signatures",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    documentId: integer("document_id")
      .notNull()
      .references(() => psychosocialDocuments.id, { onDelete: "cascade" }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    employeeId: integer("employee_id").references(() => employees.id, { onDelete: "set null" }),
    employeeName: varchar("employee_name", { length: 255 }),
    employeeCpf: varchar("employee_cpf", { length: 14 }),
    signatureType: varchar("signature_type", { length: 32 }).default("fisica").notNull(),
    status: varchar("status", { length: 32 }).default("pendente").notNull(),
    signedAt: timestamp("signed_at"),
    signatureIp: varchar("signature_ip", { length: 45 }),
    signatureHash: varchar("signature_hash", { length: 128 }),
    evidenceUrl: text("evidence_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    documentIdx: index("psychosocial_signatures_document_idx").on(t.documentId),
    companyIdx: index("psychosocial_signatures_company_idx").on(t.companyId),
  }),
);

export const psychosocialDocumentAttachments = pgTable(
  "psychosocial_document_attachments",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    documentId: integer("document_id")
      .notNull()
      .references(() => psychosocialDocuments.id, { onDelete: "cascade" }),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    fileUrl: text("file_url").notNull(),
    fileName: varchar("file_name", { length: 255 }),
    fileType: varchar("file_type", { length: 80 }),
    uploadedById: integer("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    documentIdx: index("psychosocial_attachments_document_idx").on(t.documentId),
  }),
);

export const psychosocialDistributionLogs = pgTable(
  "psychosocial_distribution_logs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    companyId: integer("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    cycleId: integer("cycle_id").references(() => assessmentCycles.id, { onDelete: "cascade" }),
    channel: varchar("channel", { length: 80 }).notNull(),
    audience: varchar("audience", { length: 255 }),
    message: text("message").notNull(),
    evidence: text("evidence"),
    createdById: integer("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => ({
    companyIdx: index("psychosocial_distribution_company_idx").on(t.companyId),
    cycleIdx: index("psychosocial_distribution_cycle_idx").on(t.cycleId),
  }),
);

// ═══════════════════════════════════════════════════════════════════════════════
// RELATIONS
// ═══════════════════════════════════════════════════════════════════════════════
export const usersRelations = relations(users, ({ many }) => ({
  companies: many(companies),
  managers: many(managers),
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
  owner: one(users, { fields: [companies.ownerId], references: [users.id] }),
  managers: many(managers),
  departments: many(departments),
  employees: many(employees),
  cycles: many(assessmentCycles),
  complaints: many(complaints),
  serviceOrders: many(serviceOrders),
  epiRecords: many(epiRecords),
  incidentRecords: many(incidentRecords),
  pgrReviews: many(pgrReviews),
  pgrReports: many(pgrReports),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  company: one(companies, { fields: [departments.companyId], references: [companies.id] }),
  employees: many(employees),
}));

export const employeesRelations = relations(employees, ({ one }) => ({
  company: one(companies, { fields: [employees.companyId], references: [companies.id] }),
  department: one(departments, { fields: [employees.departmentId], references: [departments.id] }),
}));
