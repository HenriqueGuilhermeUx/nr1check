import { z } from "zod";

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDAÇÕES REUTILIZÁVEIS
// ═══════════════════════════════════════════════════════════════════════════════
export const cnpjSchema = z
  .string()
  .min(14, "CNPJ inválido")
  .max(18)
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 14, "CNPJ deve ter 14 dígitos");

export const cpfSchema = z
  .string()
  .min(11)
  .max(14)
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length === 11, "CPF deve ter 11 dígitos");

export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .refine((v) => v.length >= 10 && v.length <= 13, "Telefone inválido");

export const emailSchema = z.string().email("E-mail inválido");

// ═══════════════════════════════════════════════════════════════════════════════
// EMPRESA
// ═══════════════════════════════════════════════════════════════════════════════
export const createCompanySchema = z.object({
  name: z.string().min(2, "Nome da empresa é obrigatório"),
  cnpj: cnpjSchema,
  type: z.enum(["empresa", "prefeitura", "orgao_publico"]).default("empresa"),
  size: z.enum(["micro", "pequena", "media", "grande"]).default("micro"),
  cnaeCode: z.string().optional(),
  cnaeDescription: z.string().optional(),
  sector: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  phone: phoneSchema.optional(),
});
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// FUNCIONÁRIO
// ═══════════════════════════════════════════════════════════════════════════════
export const createEmployeeSchema = z.object({
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().optional(),
  name: z.string().min(2, "Nome é obrigatório"),
  cpf: cpfSchema,
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  role: z.string().optional(),
  isManager: z.boolean().default(false),
});
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// CICLO DE AVALIAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════
export const createCycleSchema = z.object({
  companyId: z.number().int().positive(),
  name: z.string().min(2, "Nome do ciclo é obrigatório"),
  endDate: z.string().datetime().optional(),
});
export type CreateCycleInput = z.infer<typeof createCycleSchema>;

export const submitResponseSchema = z.object({
  cycleId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  departmentId: z.number().int().positive().optional(),
  answers: z.record(z.string(), z.number().int().min(0).max(4)),
});
export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// DENÚNCIA
// ═══════════════════════════════════════════════════════════════════════════════
export const createComplaintSchema = z.object({
  companyId: z.number().int().positive(),
  category: z.enum([
    "assedio_moral",
    "assedio_sexual",
    "discriminacao",
    "violencia",
    "burnout",
    "outros",
  ]),
  description: z.string().min(20, "Descreva o caso com mais detalhes (mínimo 20 caracteres)"),
  involvedDepartment: z.string().optional(),
  attachmentUrls: z.array(z.string()).default([]),
});
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// ORDEM DE SERVIÇO
// ═══════════════════════════════════════════════════════════════════════════════
export const generateServiceOrderSchema = z.object({
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().optional(),
  jobTitle: z.string().min(2, "Função é obrigatória"),
  mainActivities: z.string().min(10, "Descreva as atividades principais"),
});
export type GenerateServiceOrderInput = z.infer<typeof generateServiceOrderSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// EPI
// ═══════════════════════════════════════════════════════════════════════════════
export const createEpiRecordSchema = z.object({
  companyId: z.number().int().positive(),
  employeeId: z.number().int().positive(),
  epiName: z.string().min(2),
  epiCa: z.string().optional(),
  purpose: z.string().min(5),
  quantity: z.number().int().min(1).default(1),
});
export type CreateEpiRecordInput = z.infer<typeof createEpiRecordSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// INCIDENTE
// ═══════════════════════════════════════════════════════════════════════════════
export const createIncidentSchema = z.object({
  companyId: z.number().int().positive(),
  departmentId: z.number().int().positive().optional(),
  occurredAt: z.string().datetime(),
  location: z.string().optional(),
  description: z.string().min(10),
  hasInjury: z.boolean().default(false),
  injuryDescription: z.string().optional(),
  immediateAction: z.string().min(5),
  preventiveMeasures: z.string().min(5),
});
export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// REVISÃO PGR
// ═══════════════════════════════════════════════════════════════════════════════
export const createPgrReviewSchema = z.object({
  companyId: z.number().int().positive(),
  reviewReason: z.enum(["periodica", "mudanca_processo", "incidente", "fiscalizacao", "outro"]).default("periodica"),
  conclusion: z.string().min(10),
  changesRequired: z.boolean().default(false),
  changesDescription: z.string().optional(),
});
export type CreatePgrReviewInput = z.infer<typeof createPgrReviewSchema>;

// ═══════════════════════════════════════════════════════════════════════════════
// PLANOS
// ═══════════════════════════════════════════════════════════════════════════════
export const PLAN_IDS = ["nr1_solo", "nr1_pro", "corporate"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export const PLAN_LIMITS: Record<PlanId, { maxEmployees: number; name: string; priceMonthly: number }> = {
  nr1_solo: { maxEmployees: 20, name: "NR1Check Solo", priceMonthly: 7900 }, // R$ 79,00
  nr1_pro: { maxEmployees: 50, name: "NR1Check Pro", priceMonthly: 13900 }, // R$ 139,00
  corporate: { maxEmployees: 9999, name: "NR1Check Corporativo", priceMonthly: 0 }, // sob consulta
};

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════════════════════════════
export const RISK_LEVELS = ["baixo", "medio", "alto", "critico"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const COMPLAINT_STATUS = ["recebida", "em_apuracao", "concluida", "arquivada"] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUS)[number];

export function calcRiskLevel(score: number): RiskLevel {
  if (score <= 25) return "baixo";
  if (score <= 50) return "medio";
  if (score <= 75) return "alto";
  return "critico";
}
