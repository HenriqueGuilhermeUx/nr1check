-- ═══════════════════════════════════════════════════════════════════════════════
-- Row Level Security (RLS) policies para o NR1Check
-- Como o backend acessa tudo via service_role, o RLS aqui é para o caso de
-- você expor o Supabase direto para o front (recomendamos NÃO fazer isso —
-- sempre passe pela API).
-- ═══════════════════════════════════════════════════════════════════════════════

-- Habilita RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE copsoq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgr_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE cnae_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE epi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pgr_reviews ENABLE ROW LEVEL SECURITY;

-- Service role bypassa RLS automaticamente (usado pelo backend).
-- Para acesso anônimo, crie policies específicas.

-- Exemplo: COPSOQ questions são públicas (para o portal do funcionário)
CREATE POLICY "copsoq_questions_public_read" ON copsoq_questions
  FOR SELECT USING (active = true);

-- Courses e modules são públicos para funcionários
CREATE POLICY "courses_public_read" ON courses
  FOR SELECT USING (is_active = true);

CREATE POLICY "course_modules_public_read" ON course_modules
  FOR SELECT USING (true);

-- Complaints podem ser inseridas anonimamente (pelo portal)
CREATE POLICY "complaints_anonymous_insert" ON complaints
  FOR INSERT WITH CHECK (true);

CREATE POLICY "complaints_public_status" ON complaints
  FOR SELECT USING (true);

-- Demais tabelas: acesso só via service_role (backend)
-- Não crie policies — sem policy, ninguém acessa exceto service_role.
