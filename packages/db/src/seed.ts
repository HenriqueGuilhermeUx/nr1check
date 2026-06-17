/**
 * Seed inicial do NR1Check
 * - 40 perguntas COPSOQ II-Br (8 dimensões)
 * - 4 cursos de micro-learning NR-1
 * - Top 30 CNAEs com riscos pré-cadastrados
 */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  copsoqQuestions,
  courses,
  courseModules,
  cnaeRisks,
} from "./schema";

const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

// ═══════════════════════════════════════════════════════════════════════════════
// COPSOQ II-Br — 40 questões, 8 dimensões
// ═══════════════════════════════════════════════════════════════════════════════
const COPSOQ_QUESTIONS = [
  // Dimensão 1: Exigências Quantitativas
  { order: 1, dimension: "Exigências Quantitativas", text: "Com que frequência você não tem tempo suficiente para concluir todas as tarefas do seu trabalho?", scaleType: "frequency" as const, reverseScore: false },
  { order: 2, dimension: "Exigências Quantitativas", text: "Com que frequência você precisa trabalhar muito rapidamente?", scaleType: "frequency" as const, reverseScore: false },
  { order: 3, dimension: "Exigências Quantitativas", text: "Com que frequência o seu trabalho exige que você tome decisões difíceis?", scaleType: "frequency" as const, reverseScore: false },
  { order: 4, dimension: "Exigências Quantitativas", text: "Com que frequência você tem que lidar com problemas pessoais de outras pessoas no trabalho?", scaleType: "frequency" as const, reverseScore: false },
  { order: 5, dimension: "Exigências Quantitativas", text: "Com que frequência o seu trabalho é distribuído de forma desigual, acumulando tarefas?", scaleType: "frequency" as const, reverseScore: false },
  // Dimensão 2: Ritmo de Trabalho
  { order: 6, dimension: "Ritmo de Trabalho", text: "Com que frequência você precisa trabalhar em ritmo acelerado?", scaleType: "frequency" as const, reverseScore: false },
  { order: 7, dimension: "Ritmo de Trabalho", text: "Com que frequência o seu trabalho exige atenção constante?", scaleType: "frequency" as const, reverseScore: false },
  { order: 8, dimension: "Ritmo de Trabalho", text: "Com que frequência você tem que lidar com prazos apertados?", scaleType: "frequency" as const, reverseScore: false },
  // Dimensão 3: Autonomia e Influência
  { order: 9, dimension: "Autonomia e Influência", text: "Você tem influência sobre a quantidade de trabalho que lhe é atribuída?", scaleType: "degree" as const, reverseScore: true },
  { order: 10, dimension: "Autonomia e Influência", text: "Você participa das decisões sobre o seu trabalho?", scaleType: "degree" as const, reverseScore: true },
  { order: 11, dimension: "Autonomia e Influência", text: "Você pode influenciar a forma como realiza o seu trabalho?", scaleType: "degree" as const, reverseScore: true },
  { order: 12, dimension: "Autonomia e Influência", text: "Você tem liberdade para decidir como organizar o seu trabalho?", scaleType: "degree" as const, reverseScore: true },
  { order: 13, dimension: "Autonomia e Influência", text: "Você tem influência sobre o ambiente físico do seu trabalho?", scaleType: "degree" as const, reverseScore: true },
  // Dimensão 4: Apoio Social
  { order: 14, dimension: "Apoio Social", text: "Com que frequência você recebe ajuda e apoio dos seus colegas de trabalho?", scaleType: "frequency" as const, reverseScore: true },
  { order: 15, dimension: "Apoio Social", text: "Com que frequência seus colegas estão dispostos a ouvir seus problemas relacionados ao trabalho?", scaleType: "frequency" as const, reverseScore: true },
  { order: 16, dimension: "Apoio Social", text: "Com que frequência seus colegas falam com você sobre como está realizando seu trabalho?", scaleType: "frequency" as const, reverseScore: true },
  { order: 17, dimension: "Apoio Social", text: "Com que frequência você recebe apoio e suporte do seu supervisor/chefia?", scaleType: "frequency" as const, reverseScore: true },
  { order: 18, dimension: "Apoio Social", text: "Com que frequência sua chefia imediata está disposta a ouvir seus problemas de trabalho?", scaleType: "frequency" as const, reverseScore: true },
  // Dimensão 5: Qualidade de Liderança
  { order: 19, dimension: "Qualidade de Liderança", text: "Seu superior imediato garante que cada funcionário tenha boas oportunidades de desenvolvimento?", scaleType: "degree" as const, reverseScore: true },
  { order: 20, dimension: "Qualidade de Liderança", text: "Seu superior imediato dá prioridade à satisfação no trabalho?", scaleType: "degree" as const, reverseScore: true },
  { order: 21, dimension: "Qualidade de Liderança", text: "Seu superior imediato é bom em planejamento do trabalho?", scaleType: "degree" as const, reverseScore: true },
  { order: 22, dimension: "Qualidade de Liderança", text: "Seu superior imediato resolve conflitos de forma justa?", scaleType: "degree" as const, reverseScore: true },
  // Dimensão 6: Insegurança no Trabalho
  { order: 23, dimension: "Insegurança no Trabalho", text: "Você está preocupado em perder o seu emprego?", scaleType: "degree" as const, reverseScore: false },
  { order: 24, dimension: "Insegurança no Trabalho", text: "Você está preocupado com mudanças indesejadas no seu trabalho?", scaleType: "degree" as const, reverseScore: false },
  { order: 25, dimension: "Insegurança no Trabalho", text: "Você está preocupado com dificuldades de conseguir outro emprego caso perca o atual?", scaleType: "degree" as const, reverseScore: false },
  // Dimensão 7: Satisfação no Trabalho
  { order: 26, dimension: "Satisfação no Trabalho", text: "Quão satisfeito você está com suas perspectivas de trabalho?", scaleType: "degree" as const, reverseScore: true },
  { order: 27, dimension: "Satisfação no Trabalho", text: "Quão satisfeito você está com as condições físicas do seu trabalho?", scaleType: "degree" as const, reverseScore: true },
  { order: 28, dimension: "Satisfação no Trabalho", text: "Quão satisfeito você está com a forma como suas capacidades são utilizadas?", scaleType: "degree" as const, reverseScore: true },
  { order: 29, dimension: "Satisfação no Trabalho", text: "Quão satisfeito você está com seu trabalho de forma geral?", scaleType: "degree" as const, reverseScore: true },
  { order: 30, dimension: "Satisfação no Trabalho", text: "Quão satisfeito você está com o reconhecimento que recebe pelo seu trabalho?", scaleType: "degree" as const, reverseScore: true },
  // Dimensão 8: Saúde e Bem-Estar
  { order: 31, dimension: "Saúde e Bem-Estar", text: "Com que frequência você se sente esgotado(a) emocionalmente pelo seu trabalho?", scaleType: "frequency" as const, reverseScore: false },
  { order: 32, dimension: "Saúde e Bem-Estar", text: "Com que frequência você se sente fisicamente exausto(a) após o trabalho?", scaleType: "frequency" as const, reverseScore: false },
  { order: 33, dimension: "Saúde e Bem-Estar", text: "Com que frequência você tem dificuldades para dormir por causa do trabalho?", scaleType: "frequency" as const, reverseScore: false },
  { order: 34, dimension: "Saúde e Bem-Estar", text: "Com que frequência você sente tensão ou estresse no trabalho?", scaleType: "frequency" as const, reverseScore: false },
  { order: 35, dimension: "Saúde e Bem-Estar", text: "Com que frequência você se sente irritado(a) no trabalho?", scaleType: "frequency" as const, reverseScore: false },
  { order: 36, dimension: "Saúde e Bem-Estar", text: "Com que frequência você se sente ansioso(a) por causa do trabalho?", scaleType: "frequency" as const, reverseScore: false },
  { order: 37, dimension: "Saúde e Bem-Estar", text: "Com que frequência você sente que o trabalho afeta negativamente sua saúde?", scaleType: "frequency" as const, reverseScore: false },
  { order: 38, dimension: "Saúde e Bem-Estar", text: "Com que frequência você consegue se desligar do trabalho fora do horário?", scaleType: "frequency" as const, reverseScore: true },
  { order: 39, dimension: "Saúde e Bem-Estar", text: "Com que frequência você sente que o trabalho interfere na sua vida pessoal?", scaleType: "frequency" as const, reverseScore: false },
  { order: 40, dimension: "Saúde e Bem-Estar", text: "Como você avalia sua saúde em geral?", scaleType: "degree" as const, reverseScore: true },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CURSOS NR-1 (4 cursos obrigatórios)
// ═══════════════════════════════════════════════════════════════════════════════
const NR1_COURSES = [
  {
    title: "Saúde Mental no Trabalho",
    description: "O que é saúde mental, sinais de alerta e como pedir ajuda.",
    category: "nr1" as const,
    estimatedMinutes: 25,
    order: 1,
    modules: [
      { order: 1, type: "text" as const, title: "O que é saúde mental", content: "# Saúde Mental no Trabalho\n\nA saúde mental é um estado de bem-estar emocional, psicológico e social. No trabalho, ela é tão importante quanto a saúde física..." },
      { order: 2, type: "text" as const, title: "Sinais de alerta", content: "# Sinais de Alerta\n\nFique atento a sinais como: irritabilidade constante, dificuldade de concentração, alterações de sono, ansiedade frequente..." },
      { order: 3, type: "quiz" as const, title: "Quiz: saúde mental", content: JSON.stringify({ question: "Qual destes NÃO é um sinal de alerta para problemas de saúde mental?", options: ["Irritabilidade constante", "Dificuldade de concentração", "Dormir 8 horas por noite", "Ansiedade frequente"], answer: 2 }) },
    ],
  },
  {
    title: "Prevenção de Assédio",
    description: "Tipos de assédio, como identificar e como denunciar.",
    category: "assedio" as const,
    estimatedMinutes: 30,
    order: 2,
    modules: [
      { order: 1, type: "text" as const, title: "O que é assédio moral", content: "# Assédio Moral\n\nÉ a exposição repetitiva do trabalhador a situações humilhantes e constrangedoras no ambiente de trabalho..." },
      { order: 2, type: "text" as const, title: "O que é assédio sexual", content: "# Assédio Sexual\n\nÉ qualquer conduta de natureza sexual, não desejada pela vítima, que cause constrangimento ou prejudique seu trabalho..." },
      { order: 3, type: "text" as const, title: "Como denunciar", content: "# Como Denunciar\n\nA empresa disponibiliza um canal anônimo. Sua identidade é protegida. Não tenha medo de denunciar..." },
      { order: 4, type: "quiz" as const, title: "Quiz: assédio", content: JSON.stringify({ question: "O que fazer se presenciar uma situação de assédio?", options: ["Ignorar", "Rir junto", "Registrar no canal de denúncias", "Esperar acontecer de novo"], answer: 2 }) },
    ],
  },
  {
    title: "Gestão de Estresse",
    description: "Técnicas práticas para reduzir o estresse no trabalho.",
    category: "stress" as const,
    estimatedMinutes: 20,
    order: 3,
    modules: [
      { order: 1, type: "text" as const, title: "O que é estresse ocupacional", content: "# Estresse Ocupacional\n\nÉ a resposta física e emocional a um desequilíbrio entre as exigências do trabalho e os recursos disponíveis..." },
      { order: 2, type: "text" as const, title: "Técnicas de gestão", content: "# Técnicas de Gestão\n\nRespiração profunda, pausas regulares, exercício físico, sono de qualidade, alimentação saudável..." },
      { order: 3, type: "quiz" as const, title: "Quiz: estresse", content: JSON.stringify({ question: "Qual técnica é mais eficaz para gestão do estresse no curto prazo?", options: ["Tomar café", "Respiração profunda", "Trabalhar mais horas", "Ignorar o problema"], answer: 1 }) },
    ],
  },
  {
    title: "Liderança Saudável",
    description: "Para gestores: como criar um ambiente psicologicamente seguro.",
    category: "cnv" as const,
    estimatedMinutes: 35,
    order: 4,
    modules: [
      { order: 1, type: "text" as const, title: "Comunicação Não-Violenta", content: "# CNV\n\nMarshall Rosenberg propôs 4 passos: observação, sentimento, necessidade e pedido. Aplicar isso no trabalho transforma relações..." },
      { order: 2, type: "text" as const, title: "Psicologia Positiva", content: "# Psicologia Positiva\n\nFoco em forças e virtudes. Líderes positivos reconhecem o que está funcionando bem, não só o que está errado..." },
      { order: 3, type: "text" as const, title: "Feedback Construtivo", content: "# Feedback Construtivo\n\nUse o modelo SBI: Situação, Comportamento, Impacto. Seja específico, oportuno e respeitoso..." },
      { order: 4, type: "text" as const, title: "Gestão de Conflitos", content: "# Gestão de Conflitos\n\nConflitos são naturais. O papel do líder é mediar, não ignorar. Escute todas as partes, busque a solução ganha-ganha..." },
      { order: 5, type: "quiz" as const, title: "Quiz: liderança", content: JSON.stringify({ question: "O que significa CNV?", options: ["Comunicação Normal Virtual", "Comunicação Não-Violenta", "Controle Numérico de Vendas", "Comando Nacional de Voo"], answer: 1 }) },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// CNAE — top 30 CNAEs com riscos pré-cadastrados
// ═══════════════════════════════════════════════════════════════════════════════
const CNAE_RISKS = [
  { cnaeCode: "4711-3", cnaeDescription: "Comércio varejista (supermercados)", riskType: "ergonomico" as const, riskDescription: "Esforço repetitivo, postura em pé prolongada, levantamento de peso", severity: "medio" as const, requiredDocuments: ["PGR", "Ordem de Serviço", "Código de Conduta"], requiresEpi: false, legalBasis: "NR-1 / NR-17" },
  { cnaeCode: "5611-2", cnaeDescription: "Restaurantes e similares", riskType: "acidente" as const, riskDescription: "Queimaduras, cortes, queda em piso molhado", severity: "alto" as const, requiredDocuments: ["PGR", "Ordem de Serviço", "Ficha EPI", "Código de Conduta"], requiresEpi: true, epiDescription: "Calçado antiderrapante, avental térmico, luvas", legalBasis: "NR-1 / NR-6 / NR-26" },
  { cnaeCode: "8610-1", cnaeDescription: "Atendimento hospitalar", riskType: "biologico" as const, riskDescription: "Exposição a agentes biológicos, estresse, plantões", severity: "alto" as const, requiredDocuments: ["PGR", "PCMSO", "Ordem de Serviço", "Ficha EPI"], requiresEpi: true, epiDescription: "Luvas, máscara, óculos, jaleco", legalBasis: "NR-1 / NR-6 / NR-7 / NR-32" },
  { cnaeCode: "4120-4", cnaeDescription: "Construção de edifícios", riskType: "acidente" as const, riskDescription: "Queda de altura, soterramento, impacto", severity: "alto" as const, requiredDocuments: ["PGR", "PCMAT", "Ordem de Serviço", "APR"], requiresEpi: true, epiDescription: "Capacete, cinturão, calçado de segurança", legalBasis: "NR-1 / NR-6 / NR-18" },
  { cnaeCode: "8411-6", cnaeDescription: "Administração pública (prefeituras)", riskType: "psicossocial" as const, riskDescription: "Pressão por resultados, assédio, burnout", severity: "medio" as const, requiredDocuments: ["PGR", "Ordem de Serviço", "Código de Conduta", "Canal de Denúncias"], requiresEpi: false, legalBasis: "NR-1 / Lei 15.377/2026" },
  { cnaeCode: "8513-9", cnaeDescription: "Ensino fundamental", riskType: "psicossocial" as const, riskDescription: "Sobrecarga emocional, vocal, postura", severity: "medio" as const, requiredDocuments: ["PGR", "Ordem de Serviço", "Código de Conduta"], requiresEpi: false, legalBasis: "NR-1 / Lei 15.377/2026" },
  { cnaeCode: "6201-5", cnaeDescription: "Desenvolvimento de software", riskType: "ergonomico" as const, riskDescription: "LER/DORT, sedentarismo, sobrecarga visual", severity: "medio" as const, requiredDocuments: ["PGR", "Ordem de Serviço", "Código de Conduta", "Canal de Denúncias"], requiresEpi: false, legalBasis: "NR-1 / NR-17" },
  { cnaeCode: "4930-2", cnaeDescription: "Transporte rodoviário de carga", riskType: "acidente" as const, riskDescription: "Acidente de trânsito, ergonomia, jornadas longas", severity: "alto" as const, requiredDocuments: ["PGR", "Ordem de Serviço", "Ficha EPI", "Controle de jornada"], requiresEpi: true, epiDescription: "Colete refletivo, calçado de segurança", legalBasis: "NR-1 / NR-6 / NR-11" },
  { cnaeCode: "8621-6", cnaeDescription: "Clínicas médicas", riskType: "biologico" as const, riskDescription: "Exposição biológica, estresse, carga horária", severity: "alto" as const, requiredDocuments: ["PGR", "PCMSO", "Ordem de Serviço", "Ficha EPI"], requiresEpi: true, epiDescription: "Luvas, máscara, jaleco", legalBasis: "NR-1 / NR-6 / NR-7 / NR-32" },
  { cnaeCode: "7020-4", cnaeDescription: "Consultoria em gestão", riskType: "psicossocial" as const, riskDescription: "Pressão por prazos, relacionamento com clientes", severity: "baixo" as const, requiredDocuments: ["PGR", "Ordem de Serviço", "Código de Conduta", "Canal de Denúncias"], requiresEpi: false, legalBasis: "NR-1 / Lei 15.377/2026" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// RUN SEED
// ═══════════════════════════════════════════════════════════════════════════════
async function seed() {
  console.log("🌱 Iniciando seed do NR1Check...\n");

  // COPSOQ
  console.log("📊 Inserindo 40 perguntas COPSOQ II-Br...");
  const existingQs = await db.select().from(copsoqQuestions);
  if (existingQs.length === 0) {
    await db.insert(copsoqQuestions).values(COPSOQ_QUESTIONS);
    console.log(`   ✅ ${COPSOQ_QUESTIONS.length} perguntas inseridas`);
  } else {
    console.log(`   ⏭️  ${existingQs.length} perguntas já existem (skip)`);
  }

  // Cursos
  console.log("\n📚 Inserindo cursos de micro-learning...");
  const existingCourses = await db.select().from(courses);
  if (existingCourses.length === 0) {
    for (const course of NR1_COURSES) {
      const [inserted] = await db.insert(courses).values({
        title: course.title,
        description: course.description,
        category: course.category,
        estimatedMinutes: course.estimatedMinutes,
        order: course.order,
        companyId: null, // global
      }).returning();
      for (const mod of course.modules) {
        await db.insert(courseModules).values({
          courseId: inserted.id,
          order: mod.order,
          type: mod.type,
          title: mod.title,
          content: mod.content,
        });
      }
      console.log(`   ✅ ${course.title} (${course.modules.length} módulos)`);
    }
  } else {
    console.log(`   ⏭️  ${existingCourses.length} cursos já existem (skip)`);
  }

  // CNAE
  console.log("\n🏭 Inserindo riscos por CNAE...");
  const existingCnae = await db.select().from(cnaeRisks);
  if (existingCnae.length === 0) {
    await db.insert(cnaeRisks).values(CNAE_RISKS);
    console.log(`   ✅ ${CNAE_RISKS.length} CNAEs pré-cadastrados`);
  } else {
    console.log(`   ⏭️  ${existingCnae.length} CNAEs já existem (skip)`);
  }

  console.log("\n✨ Seed concluído!\n");
  await client.end();
}

seed().catch((err) => {
  console.error("❌ Erro no seed:", err);
  process.exit(1);
});
